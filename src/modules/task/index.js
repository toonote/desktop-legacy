import * as operate from './operate';
import eventHub, {EVENTS} from '../util/eventHub';
import debug from '../util/debug';

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

function noteContentChanged(data){
	logger('noteContentChanged', data);
	if(!data.id || !data.content) return;

	let existTask = getTask({
		type: 'VERSION_COMMIT',
		targetId: data.id
	});
	if(existTask) return;

	logger('no existTask, ready to create');
	operate.addTask({
		type: 'VERSION_COMMIT',
		priority: 3,
		targetId: data.id,
		data: {},
		status: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		log: [''],
	});
}


function init(){
	operate.connectRenderData(taskRenderData);
	eventHub.on(EVENTS.NOTE_CONTENT_CHANGED, noteContentChanged);
}

export default init;
