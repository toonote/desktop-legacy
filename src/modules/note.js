import Store from '../api/store/index';
import Git from './git';
import io from './io';
import path from  'path';
import fs from  'fs';
import throttle from 'lodash.throttle';
import Note from '../models/Note';

let note = {};
let store = new Store();

// 一些监听
// 比如延时提交git
// 退出前提交git
// 定时同步云服务等
let gitPath;
let gitCommit;

note.startWatch = function(){
	let git = new Git();
	gitPath = git.getPath();

	if(!git.hasInited()) git.init();

	let commitTitles = {};
	let reallyDoCommit = () => {
		let message = '';
		for(let id in commitTitles){
			message += commitTitles[id] + ' ';
		}
		git.commit(message);
		commitTitles = {};
	};
	let doGitCommit = throttle(reallyDoCommit, 5*60*1000);
	gitCommit = (id, msg) => {
		commitTitles[id] = msg;
		doGitCommit();
	};

	// app退出前提交git
	// 无效，待查
	// let app = require('electron').remote.app;
	window.addEventListener('beforeunload', (e) => {
		// console.log('ready to quit');
		// e.preventDefault();
		reallyDoCommit();
		// reallyDoSync();
		// app.exit();
	});
};

note.getTitleFromContent = function(content){
	return Note.getTitleFromContent(content);
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

note.getNoteContent = async function(id){
	return await store.readFile(`/note-${id}.md`);
};

note.deleteNote = async function(id){
	fs.unlinkSync(path.join(gitPath, `note-${id}.md`));
	gitCommit(id, `删除${id}`);
	return await store.deleteFile(`./note-${id}.md`);
};

note.saveNote = async function(note){
	fs.writeFileSync(path.join(gitPath, `note-${note.id}.md`), note.content, 'utf8');
	gitCommit(note.id, note.title);
	await store.writeFile(`/note-${note.id}.md`,note.content);
};

// 将noteMeta填充进内容，返回一个新的对象
note.fillContent = async function(note){
	let content = await this.getNoteContent(note.id);
	let noteMeta = Object.assign({}, note, {content});
	return noteMeta;
};

// 新建note
note.createNewNote = function(){
	let newNote = new Note();
	return newNote;
};

note.init = async function(id){
	var content = io.getFileText('./docs/welcome.md');
	fs.writeFileSync(path.join(gitPath, `note-${id}.md`), content, 'utf8');
	gitCommit(id, 'INIT');
	return await store.writeFile(`./note-${id}.md`, content);
};

note.startWatch();

export default note;
