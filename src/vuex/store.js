import Vue from 'vue';
import Vuex from 'vuex';

import meta from '../modules/meta';
import note from '../modules/note';
import io from '../modules/io';
import scroll from '../modules/scroll';
import renderer from '../modules/renderer';
import Git from '../modules/git';
import path from 'path';

let gitPath = path.join(require('electron').remote.app.getPath('userData'), 'git');
let git = new Git({
	path: gitPath
});
// Vue.use(Vuex);

const store = new Vuex.Store({
	state: {
		contextMenuNoteId: '',
		currentNote: null,
		currentNotebook: null,
		notebooks: [],
		// 同步滚动位置数据
		scrollMap: [],
		layout:{
			sidebar: true,
			editor: true,
			preview: true
		},
		isSearching:false,
		// 搜索结果
		searchResults:[
			// {id:'1407215592432',title:'富途\\服务器相关'},
			// {id:'1471501307415',title:'富途\\前端近期'},
		],
		versions:{
			currentNote:null,
			activeVersionId:'',
			activeVersionContent:'',
			list:[]
		},
		contextMenuVersionId: '',
		editAction: ''
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
			// console.log('[store mutations]', content);
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
		},
		switchSearching (state, isSearching) {
			state.isSearching = isSearching;
		},
		updateSearchResults (state, results) {
			state.isSearching = true;
			state.searchResults = results;
		},
		showHistory (state, data) {
			console.log(data);
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
		}
		/*currentNoteContent(state, getters){
			return getters.content;
		}*/
	},
	actions:{
		async changeCurrentNoteContent(context, content) {
			let title = note.getTitleFromContent(content);
			context.commit('changeCurrentNoteContent', content);
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

			context.dispatch('switchCurrentNoteById');
		},
		async historyContextMenuNote(context) {

			let targetNote = context.getters.allNotes.filter((note)=>note.id === context.state.contextMenuNoteId)[0];
			let fileName = `note-${context.state.contextMenuNoteId}.md`;
			let logArr = git.log(fileName);

			context.commit('showHistory', {
				note:targetNote,
				versions:logArr
			});
			await context.dispatch('switchActiveVersion');
			/*logArr.forEach((log) => {
				let content = git.show(log.id, fileName);
				console.log(`${log.date}\n\n${content}`);
			});*/
		},
		async switchActiveVersion(context, versionId) {
			if(!versionId) {
				versionId = context.state.contextMenuVersionId;
				if(!versionId){
					let activeVersion = context.state.versions.list[0];
					if(!activeVersion) return;
					versionId = activeVersion.id;
				}
			}
			let fileName = `note-${context.state.versions.currentNote.id}.md`;
			let content = git.show(versionId, fileName);
			context.commit('switchCurrentVersion', {versionId, content});
		},
		async restoreActiveVersion(context) {
			let versionId = context.state.contextMenuVersionId;
			if(!versionId) return;

			let fileName = `note-${context.state.versions.currentNote.id}.md`;
			let content = git.show(versionId, fileName);

			await context.dispatch('changeCurrentNoteContent', content);
		},
		async importBackup(context) {
			let newNotes = await io.getNotesFromBackUp();
			if(!confirm('备份文件含有'+newNotes.length+'条笔记，确认导入？')) return;

			context.dispatch('importNotes', newNotes);
		},
		async export(context, format) {
			let content = '';
			switch(format){
				case 'md':
					content = context.state.currentNote.content;
					break;
				case 'htmlBody':
					content = renderer.render(context.state.currentNote.content);
					break;
				case 'html':
				case 'pdf':
					let body = renderer.render(context.state.currentNote.content);
					// var postcss = require('postcss');
					// var atImport = require('postcss-import');
					let css = io.getFileText('/style/htmlbody.css');
					// 加载PDF样式
					if(format === 'pdf'){
						css += io.getFileText('/style/pdf.css');
					}
					// css += io.getFileText('/node_modules/highlight.js/styles/github-gist.css');
					css += io.getFileText('/node_modules/highlight.js/styles/tomorrow.css');
					/*var outputCss = postcss()
						.use(atImport())
						.process(css, {
							from: __dirname + '/render.css'
						})
						.css;*/

					content = '<!doctype html><html>\n' +
							'<head>\n' +
							'<meta charset="utf-8">\n' +
							'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
							'<meta name="author" content="TooNote">\n' +
							'<title>' + context.state.currentNote.title + '</title>\n' +
							'<style>\n' + css + '</style>\n' +
							'</head>\n' +
							'<body class="htmlBody">\n' + body + '</body>\n</html>';
							break;
			}
			io.export(format, content);
		},
		async syncScroll(context, row) {
			let targetPosition = context.state.scrollMap[row];
			// console.log(row, targetPosition);
			if(typeof targetPosition === 'undefined') return;
			scroll.doScroll(document.querySelector('.preview'), targetPosition, 500);
		},
		async exchangeNote(context, ids) {

			// console.log('ids', ids.id1, ids.id2);
			// 找到目标笔记本和笔记
			let metaData = await meta.exchange(ids.id1, ids.id2);

			context.commit('updateNotebooks', metaData.notebook);

		},
		async search(context, keyword) {
			let searchTitleResults = await meta.searchNote(keyword.toLowerCase());

			context.commit('updateSearchResults', searchTitleResults);
		}
	}
});

export default store;
