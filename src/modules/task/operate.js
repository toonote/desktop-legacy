import * as storage from './storage';
import eventHub, {EVENTS} from '../util/eventHub';
import debug from '../util/debug';

const logger = debug('task:operate');

/* const taskMap = {
	'VERSION_COMMIT': {
		interval: 5 * 60 * 1000,
		singleton: true
	}
}; */

const taskPriority = [-1, 0, 60, 300, 1800, 24 * 3600, 7 * 24 * 3600, Infinity];

/**
 * 添加一个任务
 * @param {Object} taskData 任务数据
 * @param {string} taskData.type 任务类型
 * @param {Object} taskData.data 任务数据
 */
export function addTask(taskData){
	logger('addTask', taskData);
	console.time('addTask');
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
		delete scheduledTaskMap[task.id];
		storage.deleteTask(task.id);
	});
};
export const runTask = function(task){
	if(scheduledTaskMap[task.id]) return;
	if(!hasListenTask){
		listenTask();
		hasListenTask = true;
	}
	logger('now ready to schedule task ' + task.id);
	let timeout = taskPriority[task.priority];
	if(DEBUG){
		timeout = 10;
	}
	if(timeout >= 0 && timeout < Infinity){
		timeout *= 1000;
		logger('timeout:' + timeout);
		scheduledTaskMap[task.id] = setTimeout(() => {
			logger('now run task ' + task.id);
			storage.updateTask({
				id: task.id,
				status: 2	//正在运行
			});
			eventHub.emit(EVENTS.TASK_RUN, task);
		}, timeout);
		task.runIn = timeout;
	}
};

// 初始化底层数据和渲染数据的连接
// 底层数据变动时自动更新渲染数据
export const connectRenderData = function(renderData){
	const allTasks = storage.getAllTasks();
	const mapData = function(){
		renderData.data = allTasks.map((task) => {
			let taskData = {
				id: task.id,
				type: task.type,
				priority: task.priority,
				// targetId: task.targetId,
				data: JSON.parse(task.data),
				status: task.status,
				createdAt: task.createdAt,
				updatedAt: task.updatedAt,
				log: task.log,
				runIn: 0,
				progress: 0
			};
			runTask(taskData);
			return taskData;
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
