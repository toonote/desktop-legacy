import path from 'path';
import inlineCss from 'inline-css';

import meta from '../modules/meta';
import note from '../modules/note';
import io from '../modules/io';
import scroll from '../modules/scroll';
import renderer from '../modules/renderer';
import Git from '../modules/git';
import login from '../modules/login';
import cloud from '../modules/cloud';

let gitPath = path.join(require('electron').remote.app.getPath('userData'), 'git');
let git = new Git({
	path: gitPath
});

export default {
	async init(context) {

		let metaData = await meta.data;
		// 初始化欢迎笔记
		if(!metaData.init){
			await note.init(metaData.notebook[0].notes[0].id);
			await meta.init();
		}
		context.commit('updateNotebooks', metaData.notebook);
		context.commit('switchCurrentNotebook', metaData.notebook[0]);

		let noteMeta = Object.assign({}, metaData.notebook[0].notes[0]);
		noteMeta.content = await note.getNote(noteMeta.id);
		context.commit('switchCurrentNote', noteMeta);

	},
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
			case 'htmlBodyWithCss':
				content = renderer.render(context.state.currentNote.content);
				let cssText = io.getFileText('/style/htmlbody.css');
				content = await inlineCss(`<body class="htmlBody">${content}</body>`, {
					url: '/',
					extraCss: cssText
				});
				console.log(content);
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
	},
	async doLogin(context, isAuto){
		// context.commit('updateDoingLogin', true);
		let userData = await login.doLogin(isAuto);
		if(!userData) return;
		context.commit('updateUserInfo', userData);
		// 初始化云服务
		await cloud.init();
	}
}
