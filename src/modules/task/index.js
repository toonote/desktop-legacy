import * as operate from './operate';
import eventHub, {EVENTS} from '../util/eventHub';
import debug from '../util/debug';
import { STATUS_MAP } from './TASK';

// 优先级定义
// 0 立即执行 1 接受延时执行 2 1分钟一次 3 5分钟一次 4 30分钟一次 5 1天一次 6 1周一次 7 随意多久一次

// status状态定义
// 1 待运行 2 正在运行 3 放弃运行

const logger = debug('task:index');

export let taskRenderData = {
	data: []
};

function getTask(object){
	return taskRenderData.data.filter((task) => {
		let ret = true;
		for(let key in object){
			if(task[key] !== object[key]){
				ret = false;
			}
		}
		return ret;
	})[0];
}

// 笔记内容被修改时触发
function noteContentChanged(data){
	logger('noteContentChanged', data);
	return noteChanged(data, true);
}

// 笔记（除内容以外）被修改时触发
function noteChanged(data, isContentChanged = false){
	logger('noteChanged', data);
	if(!data.id) return;
	if(isContentChanged && !data.content) return;

	// 因为内容要单独存储历史记录，所以这里分一下Note/NoteContent
	// 入库前再改为Note，把content单独存
	const targetType = isContentChanged ? 'NoteContent' : 'Note';

	let existTask = getTask({
		type: 'VERSION_COMMIT'
	});

	if(existTask){
		logger('existTask, ready to push');
		const existChanges = existTask.data.changes || [];
		const noteExist = existChanges.some((change) => {
			let changeTargetType = targetType;
			if(changeTargetType === 'NoteContent'){
				changeTargetType = 'Note';
			}
			return change.targetType === targetType &&
				change.targetId === data.id;
		});

		if(noteExist){
			logger('note exist in task');
		}else{
			existChanges.push({
				action:'edit',
				targetType,
				targetId:data.id
			});
			operate.updateTask({
				id: existTask.id,
				data: {changes:existChanges}
			});
		}
	}else{
		logger('no existTask, ready to create');
		operate.addTask({
			type: 'VERSION_COMMIT',
			priority: 3,
			// targetId: data.id,
			data: {
				changes: [{
					action: 'edit',
					targetType,
					targetId: data.id,
				}]
			},
			status: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
			log: [],
		});
	}

}

// 新建笔记时触发
function noteCreated(data){
	logger('noteCreated', data);
	if(!data.id) return;

	logger('ready to create');
	operate.addTask({
		type: 'VERSION_COMMIT',
		priority: 3,
		// targetId: data.id,
		data: {
			changes: [{
				action: 'create',
				targetType: 'Note',
				targetId: data.id,
			}]
		},
		status: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		log: [''],
	});

}

// 删除笔记时触发
function noteDeleted(noteId){
	logger('noteDeleted', noteId);
	if(!noteId) return;

	logger('ready to delete');
	operate.addTask({
		type: 'VERSION_COMMIT',
		priority: 3,
		// targetId: data.id,
		data: {
			changes: [{
				action: 'delete',
				targetType: 'Note',
				targetId: noteId,
			}]
		},
		status: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		log: [''],
	});

}

// 新建分类时触发
function categoryCreated(data){
	logger('categoryCreated', data);
	if(!data.id) return;

	logger('ready to create category');
	operate.addTask({
		type: 'VERSION_COMMIT',
		priority: 3,
		// targetId: data.id,
		data: {
			changes: [{
				action: 'create',
				targetType: 'Category',
				targetId: data.id,
			}]
		},
		status: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		log: [],
	});

}

// 分类（除内容以外）被修改时触发
function categoryChanged(data){
	logger('categoryChanged', data);
	if(!data.id) return;

	let existTask = getTask({
		type: 'VERSION_COMMIT'
	});

	if(existTask){
		logger('existTask, ready to push');
		const existChanges = existTask.data.changes || [];
		const noteExist = existChanges.some((change) => {
			return change.targetType === 'Category' &&
				change.targetId === data.id;
		});

		if(noteExist){
			logger('category exist in task');
		}else{
			existChanges.push({
				action:'edit',
				targetType:'Category',
				targetId:data.id
			});
			operate.updateTask({
				id: existTask.id,
				data: {changes:existChanges}
			});
		}
	}else{
		logger('no existTask, ready to create');
		operate.addTask({
			type: 'VERSION_COMMIT',
			priority: 3,
			// targetId: data.id,
			data: {
				changes: [{
					action: 'edit',
					targetType: 'Category',
					targetId: data.id,
				}]
			},
			status: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
			log: [],
		});
	}

}

// 删除分类时触发
function categoryDeleted(categoryId){
	logger('categoryDeleted', categoryId);
	if(!categoryId) return;

	logger('ready to delete');
	operate.addTask({
		type: 'VERSION_COMMIT',
		priority: 3,
		// targetId: data.id,
		data: {
			changes: [{
				action: 'delete',
				targetType: 'Category',
				targetId: categoryId,
			}]
		},
		status: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		log: [''],
	});

}

// 新建笔记本时触发
function notebookCreated(data){
	logger('notebookCreated', data);
	if(!data.id) return;

	logger('ready to create notebook');
	operate.addTask({
		type: 'VERSION_COMMIT',
		priority: 3,
		// targetId: data.id,
		data: {
			changes: [{
				action: 'create',
				targetType: 'Notebook',
				targetId: data.id,
			}]
		},
		status: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		log: [''],
	});

}


// 各种变更时触发云同步
function cloudSync(){
	let existTask = getTask({
		type: 'CLOUD_SYNC'
	});

	if(existTask){
		// 重置失败任务
		if(existTask.status === STATUS_MAP.FAILED){
			eventHub.emit(EVENTS.TASK_REBOOT, existTask);
			operate.updateTask({
				id: existTask.id,
				status: STATUS_MAP.QUEUE,
			});
			eventHub.emit(EVENTS.TASK_LOG, existTask, '重启任务');
		}
		logger('exist CLOUD_SYNC task, reboot.');
		return;
	}
	logger('no CLOUD_SYNC existTask, ready to create');
	operate.addTask({
		type: 'CLOUD_SYNC',
		priority: 2,
		data: {
		},
		status: STATUS_MAP.QUEUE,
		createdAt: new Date(),
		updatedAt: new Date(),
		log: [],
	});
}

function init(){
	operate.connectRenderData(taskRenderData);

	// 处理存储
	eventHub.on(EVENTS.NOTE_CONTENT_CHANGED, noteContentChanged);
	eventHub.on(EVENTS.NOTE_CHANGED, noteChanged);
	eventHub.on(EVENTS.NOTE_CREATED, noteCreated);
	eventHub.on(EVENTS.NOTE_DELETED, noteDeleted);

	eventHub.on(EVENTS.CATEGORY_CREATED, categoryCreated);
	eventHub.on(EVENTS.CATEGORY_CHANGED, categoryChanged);
	eventHub.on(EVENTS.CATEGORY_DELETED, categoryDeleted);

	eventHub.on(EVENTS.NOTEBOOK_CREATED, notebookCreated);

	// 处理同步
	eventHub.on(EVENTS.CLOUD_SYNC, cloudSync);

	eventHub.on(EVENTS.NOTE_CONTENT_CHANGED, cloudSync);
	eventHub.on(EVENTS.NOTE_CHANGED, cloudSync);
	eventHub.on(EVENTS.NOTE_CREATED, cloudSync);
	eventHub.on(EVENTS.NOTE_DELETED, cloudSync);

	eventHub.on(EVENTS.CATEGORY_CREATED, cloudSync);
	eventHub.on(EVENTS.CATEGORY_CHANGED, cloudSync);
	eventHub.on(EVENTS.CATEGORY_DELETED, cloudSync);

	eventHub.on(EVENTS.NOTEBOOK_CREATED, cloudSync);
}

export default init;
