import logger from './logger';
import Store from '../api/store/index';
import CloudApi from './cloudapi';
import meta from './meta';
import note from './note';
import {getConfig, setConfig} from './config';
const store = new Store();

// 同步所有笔记
export async function syncAllNotes(context, options = {}){
	let noteApi = new CloudApi({
		model: 'note'
	});
	let allNotes = [];
	var localMap = {};
	var remoteMap = {};
	let metaData = await meta.data;
	metaData.notebooks.forEach((notebook) => {
		notebook.notes.forEach((noteItem) => {
			allNotes.push(noteItem);
			localMap[noteItem.id] = noteItem;
		});
	});
	logger.debug(`local note count: ${allNotes.length}`);

	// balili压缩有bug，用let会导致作用域不对
	var remoteNotes = [];
	let limit = 100;
	let page = 1;
	for(;;page++){
		let remotePageNotes = await noteApi.read(0, {
			page,
			limit
		});
		remoteNotes = remoteNotes.concat(remotePageNotes);
		if(remotePageNotes.length < limit) break;
	}

	logger.debug(`remote note count: ${remoteNotes.length}`);

	remoteNotes.forEach((noteItem)=>{
		remoteMap[noteItem.id] = noteItem;
	});
	// 手工写数据双向diff啊……
	// 先下载
	for(let noteId in remoteMap){
		if(!localMap[noteId]){
			logger.debug(`id:${noteId}, title:${remoteMap[noteId].title} 本地不存在，准备下载`);
			// 如果本地不存在，则下载
			let newNote = note.createNewNote(await noteApi.read(noteId));
			await note.saveNote(newNote);
			await meta.addNote(context.state.currentNotebook.id, newNote);
			// let metaData = await meta.data;
			context.commit('newNote', newNote);
			logger.debug('下载成功');
		}else{
			let localVersion = localMap[noteId].localVersion;
			let remoteVersion = remoteMap[noteId].version;
			// 如果本地存在，比较版本号
			logger.debug(`id:${noteId}, title:${remoteMap[noteId].title}，本地版本号${localVersion}，远程版本号${remoteVersion}`);
			if(localVersion > remoteVersion){
				// 如果本地比较新，更新远程
				await noteApi.update({
					...localMap[noteId],
					content: await note.getNoteContent(noteId),
					version: localMap[noteId].localVersion
				});
				logger.debug('上传成功');
			}else if(localVersion < remoteVersion){
				// 如果本地比较旧，更新本地
				let newNote = note.createNewNote(await noteApi.read(noteId));
				// 保存笔记
				await note.saveNote(newNote);
				// 保存meta信息
				await meta.updateNote(newNote);
				context.commit('updateNote', newNote);
				logger.debug('newNote:', newNote);
				logger.debug('下载成功');
			}else{
				if(!options.noUpdate){
					// 如果版本号相同，此时应该有个备份机制，万一覆盖了有后悔药
					await noteApi.update({...localMap[noteId], version: localMap[noteId].localVersion});
					logger.debug('上传成功');
				}
			}
		}

	}

	for(let i = 0; i < allNotes.length; i++){
		let noteItem = allNotes[i];
		if(!remoteMap[noteItem.id]){
			logger.debug(`id:${noteItem.id}, title:${noteItem.title}，远程不存在，准备上传`);
			let data = {};
			data.id = noteItem.id;
			data.content = await note.getNoteContent(noteItem.id);
			data.title = note.getTitleFromContent(data.content);
			data.createdAt = noteItem.createdAt;

			await noteApi.create(data);
			logger.debug(`id:${noteItem.id}, title:${noteItem.title}，上传成功`);
		}
	}
}

// 同步单条笔记
export async function updateNote(note){
	let noteApi = new CloudApi({
		model: 'note'
	});

	await noteApi.update({...note, version: note.localVersion});
}
// 新建单条笔记
export async function createNote(note){
	let noteApi = new CloudApi({
		model: 'note'
	});

	await noteApi.create({...note, version: note.localVersion});
}
// 删除单条笔记
export async function deleteNote(id){
	let noteApi = new CloudApi({
		model: 'note'
	});

	await noteApi.delete(id);
}
