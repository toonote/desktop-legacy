import note from '../modules/note';

export default {
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
			// console.log(JSON.stringify(ret.categories['富途']));
			return ret;
		});
		return ret;
	},
	searchResultsWithCategories(state){
		let ret = {};
		state.searchResults.forEach((noteItem) => {
			let category = note.getCategoryFromTitle(noteItem.title);
			let title = note.getTitleWithoutCategory(noteItem.title);
			if(!ret[category]) ret[category] = [];
			ret[category].push({
				title:title,
				id:noteItem.id
			});
		});
		return ret;
	},
	notebooks(state){
		return state.notebooks
	},
	layout(state){
		return state.layout
	},
	isSearching(state){
		return state.isSearching
	},
	searchResults(state){
		return state.searchResults
	},
	versions(state){
		return state.versions
	},
	contextMenuVersionId(state){
		return state.contextMenuVersionId
	},
	editAction(state){
		return state.editAction
	},
	// 登录信息
	user(state){
		return state.user
	}
}
