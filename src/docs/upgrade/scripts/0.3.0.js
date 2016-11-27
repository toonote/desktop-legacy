// 0.2.0 -> 0.3.0升级脚本
let uuid = require('uuid');

let getPureTitle = function(title){
	let titlePart = title.split('\\', 2);
	if(titlePart.length === 1){
		return title;
	}else{
		return title.replace(titlePart[0]+'\\','');
	}
};

module.exports = function(){

	console.log('[upgrade]即将升级：0.2.0 -> 0.3.0');
	console.log('[upgrade]step1: 升级meta数据结构');

	let env = '';
	if(DEBUG){
		env = 'Dev-'
	}
	let metaKey = `TooNote-LocalStorage-Key-${env}meta.json`;
	console.log('[upgrade]env:%s', env);
	console.log('[upgrade]准备读取meta');
	let meta = JSON.parse(localStorage.getItem(metaKey));
	console.log('[upgrade]读取meta成功');

	console.log('[upgrade]notebook -> notebooks');
	meta.notebooks = meta.notebook;
	delete meta.notebook;

	meta.notebooks.forEach(function(notebook){
		console.log('[upgrade]notebook:%s', notebook.title);
		console.log('[upgrade]增加notebook.createdAt');
		notebook.createdAt = +notebook.id;
		console.log('[upgrade]notebook.id -> uuid');
		notebook.id = uuid.v4();

		notebook.notes.forEach(function(note){
			console.log('[upgrade]note:%s', note.title);
			console.log('[upgrade]增加note.pureTitle');
			note.pureTitle = getPureTitle(note.title);
			console.log('[upgrade]增加note.createdAt');
			note.createdAt = +notebook.id;
			console.log('[upgrade]notebook.id -> uuid');
			note.id = uuid.v4();
		});


	});
	console.log('[upgrade]准备写入meta');
	localStorage.setItem(metaKey, JSON.stringify(meta));
	console.log('[upgrade]写入meta成功');
	console.log('[upgrade]0.2.0 -> 0.3.0升级成功');

};
