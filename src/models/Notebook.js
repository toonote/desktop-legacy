import uuid from 'uuid';

export default class Note{
	constructor(data){
		this.id = this._getRandomId();
		this.title = data.title;
		this.createdAt = Date.now();
		this._notes = [];
	}
	// 获取Meta信息
	getMeta(){
		return {
			id: this.id,
			title: this.title,
			notes: this._notes
		};
	}
	_getRandomId(){
		return uuid.v4();
	}
	addNote(note){
		this._notes.push(note);
	}
	// 静态方法
	static async getNotebookById(id){

	}
}
