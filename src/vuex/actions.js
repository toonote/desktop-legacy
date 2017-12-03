import path from 'path';
import inlineCss from 'inline-css';
import {throttle} from 'lodash';


import meta from '../modules/meta';
import note from '../modules/note';
import io from '../modules/io';
import scroll from '../modules/scroll';
import renderer from '../modules/renderer';
import Git from '../modules/git';
import login from '../modules/login';
import * as cloud from '../modules/cloud';
import stat from '../modules/util/stat';
import {getConfig, setConfig} from '../modules/config';

let git = new Git();

// 初始化云服务相关
let syncNotes = {};
let reallyDoSync = async (context, callback) => {
	for(let id in syncNotes){
		await cloud.updateNote(syncNotes[id]);
		await cloud.syncAllNotes(context, {
			noUpdate: true
		});
		callback && callback();
		// syncNotes[id].remoteVersion = syncNotes[id].localVersion;
		// console.log(syncNotes[id]);
	}
	syncNotes = {};
};
let doSync = throttle(reallyDoSync, 10 * 1000);
let cloudSync = async (context, note, callback) => {
	syncNotes[note.id] = note;
	await doSync(context, callback);
};

// 获取带样式的html
let getHtmlWithCss = async (md, cssList = []) => {
	let content = renderer.render(md);
	let cssText = io.getFileText('/style/htmlbody.css');
	cssText += io.getFileText('/node_modules/highlight.js/styles/tomorrow.css');
	cssList.forEach((cssPath) => {
		cssText += io.getFileText(cssPath);
	});
	content = await inlineCss(`<body class="htmlBody">${content}</body>`, {
		url: '/',
		extraCss: cssText
	});
	return content;
};


export default {
	// 初始化
	async init(context) {

		// 初始化版本号检查，准备数据升级
		await context.dispatch('versionUpgrade');

		let metaData = await meta.data;

		logger.debug(metaData);

		// 初始化欢迎笔记
		if(!metaData.init){
			await note.init(metaData.notebooks[0].notes[0].id);
			await meta.init();
		}
		// 更新state中的笔记本和当前笔记本
		context.commit('updateNotebooks', metaData.notebooks);
		context.commit('switchCurrentNotebook', metaData.notebooks[0]);

		// 获取上一次打开的笔记ID
		let lastOpenNoteId = await getConfig('lastOpenNoteId');
		if(lastOpenNoteId){
			await context.dispatch('switchCurrentNoteById', lastOpenNoteId);
		}else{
			// 获取第一条笔记内容
			let noteMeta = await note.fillContent(metaData.notebooks[0].notes[0]);
			context.commit('switchCurrentNote', noteMeta);
		}

		// 初始化云服务
		await context.dispatch('cloudInit');
	},
	// 初始化版本号检查，如果有必要的话，做相应的升级准备工作
	async versionUpgrade(){
		let dataVersion = await getConfig('dataVersion');
		// 0.2.0 -> 0.3.0是第一个需要做数据升级的
		if(!dataVersion) dataVersion = '0.2.0';

		let versions = global['require'](path.join(
			require('electron').remote.app.getAppPath(),
			'/docs/upgrade/versions.json'
		));
		let dataVersionIndex = versions.indexOf(dataVersion);
		if(dataVersionIndex === -1){
			alert('您之前使用过更高版本软件创建过数据，使用过程中可能存在数据不兼容的情况。');
			return;
		}else if(dataVersionIndex === versions.length - 1){
			// 当前版本，不需要升级
			return;
		}

		// 准备跑升级脚本
		if(!TEST){
			alert('您已升级到新版本，即将进行数据更新，请耐心等待。');
		}

		let upgradeList = versions.slice(dataVersionIndex + 1);
		let upgradeItem;
		while(upgradeItem = upgradeList.shift()){
			let scriptPath = path.join(
				require('electron').remote.app.getAppPath(),
				`/docs/upgrade/scripts/${upgradeItem}.js`
			);
			logger.debug('即将升级到${upgradeItem}');
			let env = '';
			if(DEBUG){
				env = 'dev';
			}else if(TEST){
				env = 'test';
			}
			global['require'](scriptPath)(env);
			await setConfig('dataVersion', upgradeItem);
		}
	},
	// 初始化云服务
	async cloudInit(context){
		if(!context.state.user.id) return;
		let cloudInit = await getConfig('cloudInit');
		// if(!cloudInit){
		await cloud.syncAllNotes(context);
		await setConfig('cloudInit', true);
		// }
		setInterval(() => {
			cloud.syncAllNotes(context, {
				noUpdate: true
			});
		}, 60 * 1000);
	},
	// 登录云
	async doLogin(context, isAuto){
		// context.commit('updateDoingLogin', true);
		let userData = await login.doLogin(isAuto);
		if(!userData) return;
		context.commit('updateUserInfo', userData);
		// 初始化云服务
		await context.dispatch('cloudInit');
	},
	// 当前笔记内容变更（发生编辑等动作）
	async changeCurrentNoteContent(context, content) {

		if(content === context.state.currentNote.content) return;

		let isCloud = context.state.user.id;

		let title = note.getTitleFromContent(content);
		context.commit('changeCurrentNoteContent', content);
		context.commit('changeCurrentNoteTitle', title);

		// 目标version
		let targetVersion;

		// 找到state中的目标笔记并修改标题
		context.getters.allNotes.forEach((note) => {
			if(note.id === context.state.currentNote.id){
				note.title = title;
				// 如果需要云同步，则处理版本号
				// 当本地版本号比远程高时，不处理
				// 当本地版本号与远程相同时，版本号+1
				if(isCloud){
					if(note.localVersion === note.remoteVersion){
						targetVersion = note.localVersion + 1;
					}else{
						targetVersion = note.localVersion;
					}
					logger.debug(`targetVersion:${targetVersion}, local:${note.localVersion}, remote:${note.remoteVersion}`);
				}
			}
		});

		// 保存笔记
		await note.saveNote(context.state.currentNote);
		// 保存meta信息
		await meta.updateNote(context.state.currentNote);
		// 云同步
		if(isCloud){
			await cloudSync(context, context.state.currentNote, (function(currentNote){
				return () => {
					context.commit('updateCurrentNoteVersion', {
						id: currentNote.id,
						version: targetVersion
					});
					currentNote.localVersion = targetVersion;
					currentNote.remoteVersion = targetVersion;
					// 保存meta信息
					meta.updateNote(currentNote);
				};
			})(context.state.currentNote));
		}
	},
	// 切换当前笔记
	async switchCurrentNoteById(context, noteId) {
		let targetNote = context.getters.allNotes.filter((note)=>note.id === noteId)[0];
		console.log(targetNote);
		if(targetNote){
			let noteMeta = await note.fillContent(targetNote);
			context.commit('switchCurrentNote', noteMeta);
			// 记住当前笔记ID，下一次打开时恢复打开状态
			await setConfig('lastOpenNoteId', targetNote.id);
		}
	},
	// 导入笔记
	async importNotes(context, newNotes) {
		for(let i = 0; i < newNotes.length; i++){
			let newNote = note.createNewNote({
				id: newNotes[i].id,
				title: newNotes[i].title,
				content: newNotes[i].content
			});
			await meta.addNote(context.state.currentNotebook.id, newNote);
			await note.saveNote(newNote);
			context.commit('newNote', newNote);
		}
	},
	// 新建笔记
	async newNote(context) {
		// 获取当前笔记的分类
		let currentCategory = '未分类';
		if(context.state.currentNote && context.state.currentNote.title){
			currentCategory = note.getCategoryFromTitle(context.state.currentNote.title);
		}
		let newNote = note.createNewNote({
			content: `# ${currentCategory}\\新文档`
		});
		await note.saveNote(newNote);
		await meta.addNote(context.state.currentNotebook.id, newNote);
		// let metaData = await meta.data;
		// 烂代码……明明dispatch中有commit，但是没有作用
		context.commit('newNote', newNote);
		await context.dispatch('switchCurrentNoteById', newNote.id);
		context.commit('switchCurrentNote', newNote);
		if(context.state.user.id){
			cloud.createNote(newNote);
		}
	},
	async openContextMenuNote(context) {
		context.dispatch('switchCurrentNoteById', context.state.contextMenuNoteId);
	},
	async deleteNote(context, targetId) {

		console.log('deleteNote', targetId);
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

		// context.dispatch('switchCurrentNoteById');

		if(context.state.user.id){
			cloud.deleteNote(targetId);
		}

		if(!context.getters.allNotes.length){
			await context.dispatch('newNote');
		}

	},
	async deleteContextMenuNote(context) {
		let targetId = context.state.contextMenuNoteId;
		if(!targetId) return;

		await context.dispatch('deleteNote', targetId);
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
		if(!confirm('备份文件含有' + newNotes.length + '条笔记，确认导入？')) return;

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
				content = await getHtmlWithCss(context.state.currentNote.content);
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
		io.export(format, content, context.state.currentNote.title);
	},
	async copy(context, format) {
		let content = '';
		let type = '';
		switch(format){
			case 'md':
				type = 'text';
				content = context.state.currentNote.content;
				break;
			case 'html':
				type = 'html';
				content = await getHtmlWithCss(context.state.currentNote.content);
				break;
			case 'wx':
				type = 'html';
				content = await getHtmlWithCss(context.state.currentNote.content, [
					'/style/wx.css'
				]);
				content = content.replace(/<\/span>\n/ig, '</span><br />');
				content = content.replace(/([^>])$/img, '$1<br />');
				content = content.replace(/<br \/>\n/ig, '<br />');
				break;
		}
		let clipboard = require('electron').clipboard;
		if(type === 'text'){
			clipboard.writeText(content);
		}else if(type === 'html'){
			clipboard.write({
				text: context.state.currentNote.content,
				html: content
			});
		}

	},
	async syncScroll(context, row) {
		let targetPosition = context.state.scrollMap[row];
		// console.log(row, targetPosition);
		if(typeof targetPosition === 'undefined') return;
		scroll.doScroll(document.querySelector('.preview'), targetPosition, 500);
	},
	async exchangeNote(context, ids) {
		return;
		// console.log('ids', ids.id1, ids.id2);
		// 找到目标笔记本和笔记
		/* let metaData = await meta.exchange(ids.id1, ids.id2);

		context.commit('updateNotebooks', metaData.notebooks); */

	},
	async search(context, keyword) {
		let searchTitleResults = await meta.searchNote(keyword.toLowerCase());

		context.commit('updateSearchResults', searchTitleResults);
	},
	async clearData(context){
		console.log('clear Data');
		// await io.clearData();
	}
};
