import util from './util';
import Store from '../api/store/index';

let store = new Store(util.platform);

class Meta{
	constructor(){

	}
	get data(){
		return store.readFile('/meta.json').then((content) => {
			if(content){
				return JSON.parse(content);
			}else{
				return this._initData();
			}
		});
	}
	async _initData(){
		let data = {
			init:false,
			recent:[],
			notebook:[{
				id:Date.now()+((Math.random()*10000)>>0),
				title:'TooNote',
				notes:[{
					id:Date.now()+((Math.random()*10000)>>0),
					title:'欢迎使用TooNote',
				}]
			}]
		};
		await store.writeFile('/meta.json',JSON.stringify(data));
		return data;
	}
	async init(){
		let data = await this.data;
		data.init = true;
		await store.writeFile('/meta.json',JSON.stringify(data));
	}
	async addNote(notebookId){
		let data = await this.data;
		var targetNotebook = data.notebook.filter(function(metaNotebook){
			return metaNotebook.id === notebookId;
		})[0];

		var note = {
			id:Date.now()+((Math.random()*10000)>>0),
			title:'Unititled Note'
		};
		targetNotebook.notes.push(note);
		await store.writeFile('/meta.json', JSON.stringify(data));
		return note;
	}
	async updateNote(noteId,noteTitle){
		let data = await this.data;
		data.notebook.forEach((notebook)=>{
			notebook.notes.forEach((note)=>{
				if(note.id === noteId){
					note.title = noteTitle;
				}
			});
		});
		await store.writeFile('/meta.json', JSON.stringify(data));
		return data;
	}
	async findNoteById(noteId){
		let data = await this.data;
		let target;
		data.notebook.forEach((notebook)=>{
			notebook.notes.forEach((note)=>{
				if(note.id === noteId){
					target = note;
				}
			});
		});
		return target;
	}
	async findNotebookOfNote(noteId){
		let data = await this.data;
		let target;
		data.notebook.forEach((notebook)=>{
			notebook.notes.forEach((note)=>{
				if(note.id === noteId){
					target = notebook;
				}
			});
		});
		return target;
	}
};


let meta = new Meta();


export default meta;
