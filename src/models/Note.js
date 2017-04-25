import uuid from 'uuid';

export default class Note{
	constructor(data = {}){
		this.id = data.id || this._getRandomId();
		this.content = data.content || '# 未分类\\新文档';
		this.title = data.title || this._getTitleFromContent();
		this.pureTitle = this._getPureTitle();
		this.localVersion = data.version || data.localVersion || 1;
		this.remoteVersion = data.version || data.remoteVersion || 0;
		this.createdAt = data.createdAt && new Date(data.createdAt).getTime() || Date.now();
		this.updatedAt = data.updatedAt && new Date(data.updatedAt).getTime() || Date.now();
	}
	// 获取Note的meta信息
	getMeta(){
		return {
			id: this.id,
			title: this.title,
			pureTitle: this.pureTitle,
			createdAt: this.createdAt
		};
	}
	_getRandomId(){
		return uuid.v4();
	}
	_getPureTitle(){
		let titlePart = this.title.split('\\', 2);
		if(titlePart.length === 1){
			return this.title;
		}else{
			return this.title.replace(titlePart[0] + '\\','');
		}
	}
	_getTitleFromContent(){
		return this.constructor.getTitleFromContent(this.content);
	}
	_getRandomFileName(postfix){
		if(!postfix) postfix = '.md';
		return Date.now() + '' + ((Math.random() * 10000) >> 0) + postfix;
	}
	// 静态方法
	static getTitleFromContent(content){
		let firstLine = content.split('\n', 2)[0];
		if(!firstLine) return '';
		return firstLine.replace(/#/g, '').trim();
	}
	static async getNoteById(id){

	}
}
