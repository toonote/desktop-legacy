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
	metaData.notebook.forEach((notebook) => {
		notebook.notes.forEach((note) => {
			allNotes.push(note);
		});
	});

	for(let i=0; i<allNotes.length; i++){
		let noteItem = allNotes[i];
		let data = {};
		data.content = await note.getNoteContent(noteItem.id);
		data.title = note.getTitleFromContent(data.content);
		data.fileName = noteItem.id + '.md';
		data.createdAt = new Date(+noteItem.id).toISOString();
		console.log('[cloud] uploading:' + data.title);

		await noteApi.create(data);
	}
};
export default cloud;
