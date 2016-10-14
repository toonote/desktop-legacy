import Vue from 'vue';
import Vuex from 'vuex';

import meta from '../modules/meta';
import note from '../modules/note';
import io from '../modules/io';
import scroll from '../modules/scroll';

// Vue.use(Vuex);

const store = new Vuex.Store({
	state: {
		contextMenuNoteId: null,
		currentNote: null,
		currentNotebook: null,
		notebooks: [],
		// 同步滚动位置数据
		scrollMap: [],
		layout:{
			sidebar: true,
			editor: true,
			preview: true
		}
	},
	mutations: {
		newNote(state, note) {
			state.currentNotebook.notes.push(note);
		},
		switchCurrentNote (state, note) {
			state.currentNote = note;
		},
		switchContextMenuNote (state, noteId) {
			state.contextMenuNoteId = noteId;
		},
		switchCurrentNotebook (state, notebook) {
			state.currentNotebook = notebook;
		},
		changeCurrentNoteContent (state, content) {
			state.currentNote.content = content;
		},
		changeCurrentNoteTitle (state, title) {
			state.currentNote.title = title;
		},
		updateNotebooks (state, notebooks) {
			state.notebooks = notebooks;
		},
		changeScrollMap (state, scrollMap) {
			state.scrollMap = scrollMap;
		},
		switchLayout (state, component) {
			state.layout[component] = !state.layout[component];
		}
	},
	getters: {
		contextMenuNoteId(state){
			return state.contextMenuNoteId;
		},
		currentNote(state){
			return state.currentNote;
		},
		allNotes(state){
			let ret = [];
			state.notebooks.forEach((notebook) => {
				ret = ret.concat(notebook.notes);
			});
			return ret;
		},
		notebooksWithCategories(state){
			let ret = state.notebooks.map((notebook) => {
				let ret = {
					title:notebook.title
				};
				ret.categories = {};
				notebook.notes.forEach((noteItem) => {
					let category = note.getCategoryFromTitle(noteItem.title);
					let title = note.getTitleWithoutCategory(noteItem.title);
					if(!ret.categories[category]) ret.categories[category] = [];
					ret.categories[category].push({
						title:title,
						id:noteItem.id
					});
				});
				return ret;
			});
			return ret;
		},
		notebooks(state){
			return state.notebooks
		},
		layout(state){
			return state.layout
		}
		/*currentNoteContent(state, getters){
			return getters.content;
		}*/
	},
	actions:{
		async changeCurrentNoteContent(context, content) {
			context.commit('changeCurrentNoteContent', content);
			let title = note.getTitleFromContent(content);
			context.commit('changeCurrentNoteTitle', title);

			await note.saveNoteContent(context.state.currentNote);

			// 找到目标笔记并修改标题
			context.state.notebooks.forEach((notebook) => {
				notebook.notes.forEach((note, index) => {
					if(note.id === context.state.currentNote.id){
						note.title = title;
					}
				});
			});

			await meta.updateNote(context.state.currentNote.id, title);
		},
		async switchCurrentNoteById(context, noteId) {
			// console.log('[store switchCurrentNoteById]', noteId);
			let targetNote = context.getters.allNotes.filter((note)=>note.id === noteId)[0];
			if(targetNote){
				let content = await note.getNote(targetNote.id);
				targetNote = Object.assign({}, targetNote, {content});
				// console.log('[store] switchCurrentNoteById', targetNote);
				context.commit('switchCurrentNote', targetNote);
			}
		},
		async importNotes(context, newNotes) {
			for(let i=0; i<newNotes.length; i++){
				let newNote = newNotes[i];
				await meta.addNote(context.state.currentNotebook.id, {
					id:newNote.id,
					title:newNote.title
				});
				await note.addNote(newNote);
				context.commit('newNote', newNote);
			}
		},
		async newNote(context) {
			let newNote = await meta.addNote(context.state.currentNotebook.id);
			await note.addNote(newNote);
			// let metaData = await meta.data;
			// eventHub.$emit('metaDidChange', app.metaData);

			// eventHub.$emit('currentNoteWillChange', app.currentNote);
			context.commit('newNote', newNote);
			context.commit('switchCurrentNote', newNote);
			// eventHub.$emit('currentNoteDidChange', app.currentNote);
		},
		async openContextMenuNote(context) {
			context.dispatch('switchCurrentNoteById', context.state.contextMenuNoteId);
		},
		async deleteContextMenuNote(context) {
			let targetId = context.state.contextMenuNoteId;
			if(!targetId) return;
			// 如果删除的是当前笔记，切换到第一条笔记
			if(targetId === context.state.currentNote.id){
				context.dispatch('switchCurrentNoteById', context.getters.allNotes[0].id);
			}

			// 找到目标笔记并删除
			context.state.notebooks.forEach((notebook) => {
				notebook.notes.forEach((note, index) => {
					if(note.id === targetId){
						notebook.notes.splice(index, 1);
					}
				});
			});

			await meta.deleteNote(targetId);
			await note.deleteNote(targetId);

			context.dispatch('switchCurrentNoteById', );
		},
		async importBackup(context) {
			let newNotes = await io.getNotesFromBackUp();
			if(!confirm('备份文件含有'+newNotes.length+'条笔记，确认导入？')) return;

			context.dispatch('importNotes', newNotes);
		},
		async syncScroll(context, row) {
			let targetPosition = context.state.scrollMap[row];
			// console.log(row, targetPosition);
			if(typeof targetPosition === 'undefined') return;
			scroll.doScroll(document.querySelector('.preview'), targetPosition, 500);
		}
	}
});

export default store;
