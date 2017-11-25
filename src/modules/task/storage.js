import realm from '../storage/realm';
import idGen from '../util/idGen';
const SCHEMA = 'Task';

let allTasks;
const getAllTasks = function(){
	if(!allTasks){
		allTasks = realm.getResults(SCHEMA);
	}
	return allTasks;
};

const updateTask = function(task){
	realm.updateResult(SCHEMA, task);
};

const addTask = function(task){
	if(!task.id){
		task.id = idGen();
	}
	return updateTask(task);
};
