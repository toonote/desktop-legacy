import util from './util';
import Store from '../api/store/index';

let note = {};
let store = new Store(util.platform);

note.getTitleFromContent = function(content){
	let firstLine = content.split('\n', 2)[0];
	if(!firstLine) return '';
	return firstLine.replace(/[#\s]/g, '');
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
	return await store.deleteFile(`./note-${id}.md`);
};

note.saveNoteContent = async function(note, shouldThrottle){
	return await store.writeFile(`/note-${note.id}.md`,note.content);
};

note.init = async function(id){
	var content = `# 欢迎使用TooNote\n\nTooNote是一款基于Markdown的笔记软件。`;
	return await store.writeFile(`./note-${id}.md`,content);
};

export default note;
