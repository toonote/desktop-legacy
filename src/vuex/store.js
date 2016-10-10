import Vue from 'vue';
import Vuex from 'vuex';

import note from '../modules/note';

// Vue.use(Vuex);

const store = new Vuex.Store({
	state: {
		currentNote: null,
		notebooks: []
	},
	mutations: {
		switchCurrentNote (state, note) {
			state.currentNote = note;
		},
		changeCurrentNoteContent (state, content) {
			state.currentNote.content = content;
		},
		updateNotebooks (state, notebooks) {
			state.notebooks = notebooks;
		}
	},
	getters: {
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
				console.log('[store] switchCurrentNoteById', targetNote);
				context.commit('switchCurrentNote', targetNote);
			}
		}
	}
});

export default store;
