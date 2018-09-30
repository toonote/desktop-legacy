import * as storage from './storage';
import eventHub, {EVENTS} from '../util/eventHub';
import {RenderTask, STATUS_MAP} from './TASK';
import debug from '../util/debug';

const logger = debug('task:operate');


/**
 * 添加一个任务
 * @param {Object} taskData 任务数据
 * @param {string} taskData.type 任务类型
 * @param {Object} taskData.data 任务数据
 */
export function addTask(taskData){
	logger('addTask', taskData);
	console.time('addTask');
	taskData.log.push('生成任务');
	taskData.data = JSON.stringify(taskData.data);
	storage.addTask(taskData);
	console.timeEnd('addTask');
}

/**
 * 更新一个任务
 * @param {Object} taskData 任务数据
 */
export function updateTask(taskData){
	logger('updateTask', taskData);
	console.time('updateTask');
	taskData.data = JSON.stringify(taskData.data);
	storage.updateTask(taskData);
	console.timeEnd('updateTask');
}


export function cancelTask(taskId){

}

export function getAllTasks(){

}

export function getTasksByType(type){

}

// 安排运行任务
const scheduledTaskMap = {};
let hasListenTask = false;
const listenTask = function(){
	logger('listenTask');
	eventHub.on(EVENTS.TASK_FINISH, (task) => {
		logger('task finished: ' + task.id);
		clearTimeout(scheduledTaskMap[task.id]);
		delete scheduledTaskMap[task.id];
		storage.deleteTask(task.id);
	});
	eventHub.on(EVENTS.TASK_LOG, (task, message) => {
		logger('task log: ' + task.id + ' ' + message);
		const log = task.log.map(v=>v);
		log.push(message);
		storage.updateTask({
			id: task.id,
			log: log
		});
	});
	eventHub.on(EVENTS.TASK_FAIL, (task) => {
		logger('task fail: ' + task.id);
		storage.updateTask({
			id: task.id,
			status: STATUS_MAP.FAILED
		});
	});
	eventHub.on(EVENTS.TASK_REBOOT, (task) => {
		logger('task reboot: ' + task.id);
		clearTimeout(scheduledTaskMap[task.id]);
		delete scheduledTaskMap[task.id];
	});
};
export const runTask = function(task){
	if(scheduledTaskMap[task.id]) return;
	if(!hasListenTask){
		listenTask();
		hasListenTask = true;
	}
	logger('now ready to schedule task ' + task.id);
	let timeout = task.runIn;
	if(timeout >= 0 && timeout < Infinity){
		timeout *= 1000;
		logger('timeout:' + timeout);
		scheduledTaskMap[task.id] = setTimeout(() => {
			// 排队任务刚刚完成，但还没从DB删除的情况
			// 实测多个任务一起跑，前一个任务被删除会触发DB变更
			// 从而将该任务再次拿出来跑
			if(!storage.getTaskById(task.id)) return;
			logger('now run task ' + task.id);
			storage.updateTask({
				id: task.id,
				status: 2	//正在运行
			});
			eventHub.emit(EVENTS.TASK_RUN, task);
		}, timeout);
		// task.runIn = timeout;
		// task.runAt = new Date(Date.now() + timeout);
	}
};

// 初始化底层数据和渲染数据的连接
// 底层数据变动时自动更新渲染数据
export const connectRenderData = function(renderData){
	const allTasks = storage.getAllTasks();
	const mapData = function(){
		renderData.data = allTasks.map((task) => {
			let renderTask = new RenderTask(task);
			runTask(renderTask);
			return renderTask;
		});
	};

	mapData();
	allTasks.addListener((puppies, changes) => {
		logger('task realm data changed');
		logger(puppies);
		logger(changes);
		mapData();
	});
};
