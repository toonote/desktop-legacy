import Store from '../api/store/index';
import CloudApi from './cloudapi';
import meta from './meta';
import note from './note';
import {getConfig, setConfig} from './config';
const store = new Store();

// 上传所有笔记
export async function uploadAllNotes(){
	let noteApi = new CloudApi({
		model: 'note'
	});
	let allNotes = [];
	let metaData = await meta.data;
	metaData.notebooks.forEach((notebook) => {
		notebook.notes.forEach((note) => {
			allNotes.push(note);
		});
	});

	for(let i=0; i<allNotes.length; i++){
		let noteItem = allNotes[i];
		let data = {};
		data.id = noteItem.id;
		data.content = await note.getNoteContent(noteItem.id);
		data.title = note.getTitleFromContent(data.content);
		data.createdAt = noteItem.createdAt;
		console.log('[cloud] uploading:' + data.title);

		await noteApi.create(data);
	}
};

// 同步单条笔记
export async function updateNote(note){
	let noteApi = new CloudApi({
		model: 'note'
	});

	await noteApi.update(note);
};
// 新建单条笔记
export async function createNote(note){
	let noteApi = new CloudApi({
		model: 'note'
	});

	await noteApi.create(note);
};
// 删除单条笔记
export async function deleteNote(id){
	let noteApi = new CloudApi({
		model: 'note'
	});

	await noteApi.delete(id);
};
