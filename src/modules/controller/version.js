import eventHub, {EVENTS} from '../util/eventHub';
import * as realm from '../storage/realm';
import debug from '../util/debug';

const logger = debug('controller:version');
const createVersion = function(task){
	if(task.type !== 'VERSION_COMMIT') return;
	if(!task.data.taskIds){
		eventHub.emit(EVENTS.TASK_FINISH, task);
		return;
	}

	console.time('createVersion');
	// 获取所有涉及的笔记
	const allNotes = realm.getResults('Note').filtered(task.data.taskIds.map((taskId) => {
		return `id="${taskId}"`;
	}).join(' OR '));

	if(!allNotes.length) return;

	logger('ready to create version for ' + allNotes.length + ' notes.');

	// 新建版本
	const versionId = realm.createResult('Version', {
		message: '【修改】\n' + allNotes.map((note) => note.title).join('\n'),
		notes: allNotes
	});
	logger('version id ' + versionId);

	// 记录笔记内容
	const noteVersionData = allNotes.map((note) => {
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
