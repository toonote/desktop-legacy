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
			console.log('[store]',state);
		},
		switchCurrentNotebook (state, notebook) {
			state.currentNotebook = notebook;
		},
		changeCurrentNoteContent (state, content) {
			state.currentNote.content = content;
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
			await note.saveNoteContent(context.state.currentNote);
		},
		async switchCurrentNoteById(context, noteId) {
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
		}
	}
});

export default store;
