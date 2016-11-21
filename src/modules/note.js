import util from './util';
import Store from '../api/store/index';
import Git from './git';
import io from './io';
import path from  'path';
import fs from  'fs';
import throttle from 'lodash.throttle';

let note = {};
let store = new Store(util.platform);

// 一些监听
// 比如延时提交git
// 退出前提交git
// 定时同步云服务等
let gitPath = path.join(require('electron').remote.app.getPath('userData'), 'git');
let gitCommit;

note.startWatch = function(){
	let git = new Git({
		path: gitPath
	});

	if(!git.hasInited()) git.init();

	let commitTitles = [];
	let doGitCommit = throttle(() => {
		git.commit(commitTitles.join(' '));
		commitTitles = [];
	}, 5*60*1000);
	gitCommit = (msg) => {
		if(commitTitles.indexOf(msg) === -1){
			commitTitles.push(msg);
		}
		doGitCommit();
	};

	// app退出前提交git
	// 无效，待查
	// let app = require('electron').remote.app;
	window.addEventListener('beforeunload', (e) => {
		// console.log('ready to quit');
		// e.preventDefault();
		git.commit(commitTitles.join(' '));
		// app.exit();
	});
};

note.getTitleFromContent = function(content){
	let firstLine = content.split('\n', 2)[0];
	if(!firstLine) return '';
	return firstLine.replace(/#/g, '').trim();
};

note.getTitleWithoutCategory = function(title){
	let titlePart = title.split('\\', 2);
	if(titlePart.length === 1){
		return title;
	}else{
		return title.replace(titlePart[0]+'\\','');
	}
};

note.getCategoryFromTitle = function(title){
	let titlePart = title.split('\\', 2);
	if(titlePart.length === 1){
		return '未分类';
	}else{
		return titlePart[0];
	}
};

note.getNote = async function(id){
	return await store.readFile(`/note-${id}.md`);
};

note.addNote = async function(note){
	if(!note.content){
		note.content = '# Untitled Note';
	}
	return await this.saveNoteContent(note);
};

note.deleteNote = async function(id){
	fs.unlinkSync(path.join(gitPath, `note-${id}.md`));
	gitCommit(`删除${id}`);
	return await store.deleteFile(`./note-${id}.md`);
};

note.saveNoteContent = async function(note, shouldThrottle){
	fs.writeFileSync(path.join(gitPath, `note-${note.id}.md`), note.content, 'utf8');
	gitCommit(note.title);
	return await store.writeFile(`/note-${note.id}.md`,note.content);
};

note.init = async function(id){
	var content = io.getFileText('./docs/welcome.md');
	fs.writeFileSync(path.join(gitPath, `note-${id}.md`), content, 'utf8');
	gitCommit('INIT');
	return await store.writeFile(`./note-${id}.md`,content);
};

note.startWatch();

export default note;
