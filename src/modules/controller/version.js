import eventHub, {EVENTS} from '../util/eventHub';
import * as realm from '../storage/realm';
import debug from '../util/debug';

const logger = debug('controller:version');
const createVersion = function(task){

	if(task.type !== 'VERSION_COMMIT') return;
	if(!task.data.changes){
		eventHub.emit(EVENTS.TASK_FINISH, task);
		return;
	}

	console.time('createVersion');

	// 按action/targetType归类
	// const allChanges = {};
	const allChanges = task.data.changes;
	const allNoteIds = [];
	const allCategoryIds = [];
	const allNotebookIds = [];

	allChanges.forEach((change) => {
		// if(!allChanges[change.targetType]) allChanges[change.targetType] = {};
		// if(!allChanges[change.targetType][change.action]) allChanges[change.targetType][change.action] = [];
		// allChanges[change.targetType][change.action].push(change);
		if(change.targetType === 'Note' || change.targetType === 'NoteContent'){
			allNoteIds.push(change.targetId);
		}else if(change.targetType === 'Category'){
			allCategoryIds.push(change.targetId);
		}else if(change.targetType === 'Notebook'){
			allNotebookIds.push(change.targetId);
		}
	});

	let allNotes = [];
	if(allNoteIds.length){
		allNotes = realm.getResults('Note').filtered(allNoteIds.map((noteId) => {
			return `id="${noteId}"`;
		}).join(' OR '));
	}
	let allCategories = [];
	if(allCategoryIds.length){
		allCategories = realm.getResults('Category').filtered(allCategoryIds.map((noteId) => {
			return `id="${noteId}"`;
		}).join(' OR '));
	}
	let allNotebooks = [];
	if(allNotebookIds.length){
		allNotebooks = realm.getResults('Notebook').filtered(allNotebookIds.map((noteId) => {
			return `id="${noteId}"`;
		}).join(' OR '));
	}


	/* // 获取所有涉及的笔记
	const allNoteChanges = allChanges.filter((change) => {
		return change.targetType === 'Note' || change.targetType === 'NoteContent';
	}); */

	logger('ready to create version');

	// 获取最新版本
	const allVersion = realm.getResults('Version').sorted('createdAt', true);
	let lastVersion;
	for(let i = 0; i < allVersion.length; i++) {
		if(!allVersion[i].childVersion.length){
			lastVersion = allVersion[i];
			break;
		}
	}

	// 新建版本
	const versionId = realm.createResult('Version', {
		message: allChanges.map((change) => {
			const actionMap = {
				create: '新建',
				edit: '修改',
				delete: '删除',
			};

			const targetTypeMap = {
				Note: '笔记',
				NoteContent: '笔记',
				Category: '分类',
				Notebook: '笔记本',
			};

			const targetTypeStr = targetTypeMap[change.targetType];
			const actionStr = actionMap[change.action];
			let schema = change.targetType;
			if(schema === 'NoteContent'){
				schema = 'Note';
			}


			let messageItem = '';
			if(change.action === 'delete'){
				messageItem = `【${targetTypeStr}】【${actionStr}】${change.targetId}`;
			}else{
				const target = realm.getResults(schema).filtered(`id="${change.targetId}"`)[0];
				if(target){
					messageItem = `【${targetTypeStr}】【${actionStr}】${target.title}`;
				}
			}
			return messageItem;
		}).filter((line)=>line).join('\n'),
		notes: allNotes,
		categories: allCategories,
		notebooks: allNotebooks,
		parentVersion: lastVersion,
		changes: JSON.stringify(allChanges.map((change) => {
			let schema = change.targetType;
			if(schema === 'NoteContent'){
				schema = 'Note';
			}
			const target = realm.getResults(schema).filtered(`id="${change.targetId}"`)[0];
			if(change.action === 'delete'){
				return {
					action: change.action,
					targetType: schema,
					targetId: change.targetId,
					data: {}
				};
			}

			if(!target) return null;

			return {
				action: change.action,
				targetType: schema,
				targetId: change.targetId,
				// 内容变更不写在这里
				// todo:关联关系
				data: {
					id: target.id,
					title: target.title,
					order: target.order,
					createdAt: target.createdAt,
					updatedAt: target.updatedAt,
				},
			};
		}).filter((change)=>change))
	});
	logger('version id ' + versionId);

	// 记录笔记内容
	// 获取所有涉及的笔记
	const noteContentChangeIds = allChanges.filter((change) => {
		return change.targetType === 'NoteContent' || change.action === 'create';
	}).map((change) => change.targetId);

	const noteVersionData = allNotes.filter((note) => {
		return noteContentChangeIds.indexOf(note.id) > -1;
	}).map((note) => {
		return {
			versionId,
			noteId: note.id,
			content: note.content
		};
	});

	realm.createResult('VersionNoteContent', noteVersionData);

	eventHub.emit(EVENTS.TASK_FINISH, task);
	console.time('createVersion');
};

export function init(){
	eventHub.on(EVENTS.TASK_RUN, createVersion);
}
