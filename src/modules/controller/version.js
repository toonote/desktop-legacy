import eventHub, {EVENTS} from '../util/eventHub';
import * as realm from '../storage/realm';
import debug from '../util/debug';

const logger = debug('controller:version');
const createVersion = function(task){

	if(task.type !== 'VERSION_COMMIT') return;
	const allChanges = task.data.changes;
	if(!allChanges){
		eventHub.emit(EVENTS.TASK_FINISH, task);
		return;
	}

	console.time('createVersion');
	// 获取所有涉及的笔记
	const allNoteChanges = allChanges.filter((change) => {
		return change.targetType === 'Note' || change.targetType === 'NoteContent';
	});

	const allNoteIds = allNoteChanges.map((change) => change.targetId);

	const allNotes = realm.getResults('Note').filtered(allNoteIds.map((noteId) => {
		return `id="${noteId}"`;
	}).join(' OR '));

	// todo:还有分类和笔记本
	// if(!allNotes.length) return;

	logger('ready to create version for ' + allNotes.length + ' notes.');

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
		message: allNoteChanges.map((change) => {
			const actionMap = {
				create: '新建',
				edit: '修改',
				delete: '删除',
			};
			let messageItem = '';
			if(change.action === 'delete'){
				messageItem = `【${actionMap[change.action]}】${change.targetId}`;
			}else{
				const note = allNotes.filter((note) => {
					return note.id === change.targetId;
				})[0];
				if(note){
					messageItem = `【${actionMap[change.action]}】${note.title}`;
				}
			}
			return messageItem;
		}).filter((line)=>line).join('\n'),
		notes: allNotes,
		parentVersion: lastVersion,
		changes: JSON.stringify(allChanges.map((change) => {
			const note = allNotes.filter((note) => {
				return note.id === change.targetId;
			})[0];

			if(change.action === 'delete'){
				return {
					action: change.action,
					targetType: 'Note',
					targetId: change.targetId,
					data: {}
				};
			}

			if(!note) return null;

			return {
				action: change.action,
				targetType: 'Note',
				targetId: note.id,
				// 内容变更不写在这里
				// todo:关联关系
				data: {
					id: note.id,
					title: note.title,
					order: note.order,
					createdAt: note.createdAt,
					updatedAt: note.updatedAt,
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
