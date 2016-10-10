import Vue from 'vue';
import Vuex from 'vuex';

import note from '../modules/note';

// Vue.use(Vuex);

const store = new Vuex.Store({
	state: {
		currentNote: null
	},
	mutations: {
		switchCurrentNote (state, note) {
			state.currentNote = note;
		},
		changeCurrentNoteContent (state, content) {
			state.currentNote.content = content;
		}
	},
	getters: {
		currentNote(state){
			return state.currentNote;
		},
		/*currentNoteContent(state, getters){
			return getters.content;
		}*/
	},
	actions:{
		async changeCurrentNoteContent(context, content) {
			context.commit('changeCurrentNoteContent', content);
			await note.saveNoteContent(context.state.currentNote);
		}
	}
});

export default store;
