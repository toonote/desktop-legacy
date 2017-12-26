import EventEmitter from 'events';

const eventHub = new EventEmitter();
export default eventHub;

export const EVENTS = {
	NOTE_CONTENT_CHANGED: 'NOTE_CONTENT_CHANGED',
	TASK_RUN: 'TASK_RUN',
	TASK_FINISH: 'TASK_FINISH'
};
