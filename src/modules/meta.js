import util from './util';
import Store from '../api/store/index';
import Note from '../models/Note';
import Notebook from '../models/Notebook';

let store = new Store(util.platform);

class Meta{
	constructor(){

	}
	get data(){
		return store.readFile('/meta.json').then((content) => {
			if(content){
				let metaData = JSON.parse(content);
				metaData.notebooks.forEach((notebook) => {
					notebook.notes.forEach((noteItem) => {
						if(!noteItem.localVersion){
							noteItem.localVersion = 1;
						}
						if(!noteItem.remoteVersion){
							noteItem.remoteVersion = 0;
						}
					});
				});
				return metaData;
			}else{
				return this._initData();
			}
		});
	}
	async _initData(){
		let newNotebook = new Notebook({
			title:'TooNote'
		});
		newNotebook.addNote(new Note({
			title:'欢迎使用TooNote',
		}).getMeta());

		let data = {
			init:false,
			recent:[],
			notebooks:[newNotebook.getMeta()]
		};

		await store.writeFile('/meta.json', JSON.stringify(data));
		return data;
	}
	async init(){
		let data = await this.data;
		data.init = true;
		await store.writeFile('/meta.json',JSON.stringify(data));
	}
	async addNote(notebookId, note){
		let data = await this.data;
		var targetNotebook = data.notebooks.filter(function(metaNotebook){
			return metaNotebook.id === notebookId;
		})[0];

		targetNotebook.notes.push(note.getMeta());
		await store.writeFile('/meta.json', JSON.stringify(data));
		return note;
	}
	async deleteNote(noteId){
		let data = await this.data;
		data.notebooks.forEach((notebook)=>{
			notebook.notes.forEach((note, index)=>{
				if(note.id === noteId){
					notebook.notes.splice(index, 1);
				}
			});
		});
		await store.writeFile('/meta.json', JSON.stringify(data));
	}
	async updateNote(note){
		let data = await this.data;
		data.notebooks.forEach((notebook)=>{
			notebook.notes.forEach((noteItem)=>{
				if(note.id === noteItem.id){
					noteItem.title = note.title;
					noteItem.localVersion = note.localVersion;
					noteItem.remoteVersion = note.remoteVersion;
					// noteItem.pureTitle = note.
				}
			});
		});
		await store.writeFile('/meta.json', JSON.stringify(data));
		return data;
	}
	async findNoteById(noteId){
		let data = await this.data;
		let target;
		data.notebooks.forEach((notebook)=>{
			notebook.notes.forEach((note)=>{
				if(note.id === noteId){
					target = note;
				}
			});
		});
		return target;
	}
	async searchNote(keyword){
		let data = await this.data;
		let ret = [];
		data.notebooks.forEach((notebook)=>{
			notebook.notes.forEach((note)=>{
				if(note.title.toLowerCase().indexOf(keyword) > -1){
					ret.push(note);
				}
			});
		});
		return ret;
	}
	async findNotebookOfNote(noteId){
		let data = await this.data;
		let target;
		data.notebooks.forEach((notebook)=>{
			notebook.notes.forEach((note)=>{
				if(note.id === noteId){
					target = notebook;
				}
			});
		});
		return target;
	}
	async exchange(id1, id2){
		let data = await this.data;

		let notebook1, notebook2;
		let note1, note2;
		let index1, index2;

		data.notebooks.forEach((notebook) => {
			notebook.notes.forEach((note, index) => {
				if(note.id === id1){
					notebook1 = notebook;
					note1 = note;
					index1 = index;
				}
				if(note.id === id2){
					notebook2 = notebook;
					note2 = note;
					index2 = index;
				}
			});
		});

		// 只能交换同一笔记本中的笔记
		if(notebook1 !== notebook2) return data;
		// 交换
		notebook1.notes.splice(index1, 1, note2);
		notebook1.notes.splice(index2, 1, note1);

		await store.writeFile('/meta.json', JSON.stringify(data));
		return data;

	}
}


let meta = new Meta();


export default meta;
