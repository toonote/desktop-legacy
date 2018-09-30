const taskPriority = [-1, 0, 60, 300, 1800, 24 * 3600, 7 * 24 * 3600, Infinity];
const statusMap = {
	QUEUE: 1,
	RUNNING: 2,
	FAILED: 3,
};

export class RenderTask{
	constructor(task){
		this.id = task.id;
		this.type = task.type;
		this.priority = task.priority;
		this.data = JSON.parse(task.data);
		this.status = task.status;
		this.createdAt = task.createdAt;
		this.updatedAt = task.updatedAt;
		this.log = task.log;
		this.runIn = taskPriority[task.priority];
		if(DEBUG){
			this.runIn = 10;
		}
		if(+this.status === statusMap.RUNNING){
			this.runIn = 0;
		}
		this.runAt = new Date(Date.now() + this.runIn * 1000);
		this.progress = 0;
		// console.log(this.runAt);
	}
}
export const MAP = {
	VERSION_COMMIT: {
		type: 'VERSION_COMMIT',
		text: '生成版本记录'
	},
	CLOUD_SYNC: {
		type: 'CLOUD_SYNC',
		text: '云同步'
	}
};
