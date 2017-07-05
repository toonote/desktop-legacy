import logger from '../modules/logger';
export default {
	newNote(state, note) {
		state.currentNotebook.notes.push(note);
	},
	switchCurrentNote (state, note) {
		logger.debug('switchCurrentNote');
		state.currentNote = note;
	},
	switchContextMenuNote (state, noteId) {
		state.contextMenuNoteId = noteId;
	},
	switchCurrentNotebook (state, notebook) {
		state.currentNotebook = notebook;
	},
	changeCurrentNoteContent (state, content) {
		logger.debug('changeCurrentNoteContent');
		// logger.debug(state.currentNote.content);
		state.currentNote.content = content;
	},
	changeCurrentNoteTitle (state, title) {
		state.currentNote.title = title;
	},
	updateCurrentNoteVersion (state, data){
		if(state.currentNote.id === data.id){
			logger.debug('mutation, data.version:', data.version);
			state.currentNote.remoteVersion = data.version;
			state.currentNote.localVersion = data.version;
		}
		state.notebooks.forEach((notebook) => {
			notebook.notes.filter((noteItem) => noteItem.id === data.id).forEach((noteItem) => {
				noteItem.remoteVersion = data.version;
				noteItem.localVersion = data.version;
			});
		});
	},
	updateNote (state, note) {
		if(state.currentNote.id === note.id){
			state.currentNote.title = note.title;
			state.currentNote.content = note.content;
			state.currentNote.localVersion = note.localVersion;
			state.currentNote.remoteVersion = note.remoteVersion;
			state.currentNote.updatedAt = note.updatedAt;
		}
		state.notebooks.forEach((notebook) => {
			notebook.notes.filter((noteItem) => noteItem.id === note.id).forEach((noteItem) => {
				noteItem.title = note.title;
				noteItem.content = note.content;
				noteItem.localVersion = note.localVersion;
				noteItem.remoteVersion = note.remoteVersion;
				noteItem.updatedAt = note.updatedAt;
			});
		});
	},
	updateNotebooks (state, notebooks) {
		state.notebooks = notebooks;
	},
	changeScrollMap (state, scrollMap) {
		state.scrollMap = scrollMap;
	},
	switchLayout (state, component) {
		state.layout = {
			...state.layout,
			[component]: !state.layout[component]
		};
	},
	switchSearching (state, isSearching) {
		state.isSearching = isSearching;
	},
	updateSearchResults (state, results) {
		state.isSearching = true;
		state.searchResults = results;
	},
	showHistory (state, data) {
		state.versions.currentNote = data.note;
		state.versions.list = data.versions;
	},
	switchCurrentVersion(state, data) {
		state.versions.activeVersionId = data.versionId;
		state.versions.activeVersionContent = data.content;
	},
	hideVersions(state){
		state.versions.activeVersionId = '';
		state.versions.activeVersionContent = '';
		state.versions.list = [];
		state.versions.currentNote = null;
	},
	switchContextMenuVersion(state, versionId){
		state.contextMenuVersionId = versionId;
	},
	editAction(state, action){
		state.editAction = action;
	},
	// 登录
	updateDoingLogin(state, isDoing){
		state.user.doingLogin = isDoing;
	},
	// 更新用户信息
	updateUserInfo(state, user){
		state.user.doingLogin = false;
		state.user.id = user.id;
		state.user.name = user.name;
		state.user.avatarUrl = user.avatarUrl;
	}
};
