import * as realm from '../storage/realm';
import idGen from '../util/idGen';
import debug from '../util/debug';

const logger = debug('task:storage');
const SCHEMA = 'Task';


let allTasks;
export const getAllTasks = function(){
	if(!allTasks){
		allTasks = realm.getResults(SCHEMA);
	}
	return allTasks;
};

export const updateTask = function(task){
	realm.updateResult(SCHEMA, task);
};

export const addTask = function(task){
	if(!task.id){
		task.id = idGen();
	}
	return realm.createResult(SCHEMA, task);
};

export const deleteTask = function(taskId){
	if(!taskId) return;
	realm.deleteResult('Task', taskId);
};
