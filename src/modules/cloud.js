import Store from '../api/store/index';
import CloudApi from './cloudapi';
import meta from './meta';
import note from './note';
const store = new Store();

let cloud = {};

// 初始化云服务
cloud.init = async function(){
	let configStr = await store.readFile('/cloud-config');
	if(!configStr) configStr = '{}';
	let config = JSON.parse(configStr);
	if(!config.inited){
		console.log('[cloud] uploadAllNotes:ready.');
		await cloud.uploadAllNotes();
		console.log('[cloud] uploadAllNotes:finished.');
		config.inited = true;
		await store.writeFile('/cloud-config', JSON.stringify(config));
	}
};

// 上传所有笔记
cloud.uploadAllNotes = async function(){
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
cloud.updateNote = async function(note){
	let noteApi = new CloudApi({
		model: 'note'
	});

	await noteApi.update(note);
};
// 新建单条笔记
cloud.createNote = async function(note){
	let noteApi = new CloudApi({
		model: 'note'
	});

	await noteApi.create(note);
};
// 删除单条笔记
cloud.delete = async function(id){
	let noteApi = new CloudApi({
		model: 'note'
	});

	await noteApi.delete(id);
};
export default cloud;
