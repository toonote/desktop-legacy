import Vue from 'vue';
import Vuex from 'vuex';

import meta from '../modules/meta';
import note from '../modules/note';

// Vue.use(Vuex);

const store = new Vuex.Store({
	state: {
		contextMenuNoteId: null,
		currentNote: null,
		currentNotebook: null,
		notebooks: []
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
		notebooks(state){
			return state.notebooks
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
			console.log('[store switchCurrentNoteById]', noteId);
			let targetNote = context.getters.allNotes.filter((note)=>note.id === noteId)[0];
			if(targetNote){
				let content = await note.getNote(targetNote.id);
				targetNote = Object.assign({}, targetNote, {content});
				// console.log('[store] switchCurrentNoteById', targetNote);
				context.commit('switchCurrentNote', targetNote);
			}
		},
		async newNote(context) {
			var noteMeta = await meta.addNote(context.state.currentNotebook.id);
			// let metaData = await meta.data;
			// eventHub.$emit('metaDidChange', app.metaData);
			await note.addNote(noteMeta);

			// eventHub.$emit('currentNoteWillChange', app.currentNote);
			context.commit('newNote', noteMeta);
			context.commit('switchCurrentNote', noteMeta);
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
				context.dispatch('switchCurrentNoteById', context.state.allNotes[0].id);
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
		}
	}
});

export default store;
