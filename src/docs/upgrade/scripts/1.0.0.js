// 0.2.0 -> 0.3.0升级脚本
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const Realm = require('realm');
const Schemas = require('./1.0.0.schema');

const initRealm = function(env){
	let filename = 'toonote.realm';
	if(env === 'test'){
		filename = 'toonote.test.realm';
	}
	if(env === 'dev'){
		filename = 'toonote.debug.realm';
	}
	const DB_PATH = path.join(require('electron').remote.app.getPath('userData'), filename);
	return new Realm({
		schema: [
			Schemas.Config,
			Schemas.Notebook,
			Schemas.Category,
			Schemas.Note,
			Schemas.Attachment,
			Schemas.Version,
			Schemas.VersionNoteContent,
			Schemas.Task
		],
		schemaVersion: 1,
		path: DB_PATH
	});
};

const getCategoryAndTitle = function(title){
	let titlePart = title.split('\\', 2);
	if(titlePart.length === 1){
		return {
			category: '默认分类',
			title
		};
	}else{
		let category = titlePart[0].replace(/^#*\s*/, '');
		if(category === '未分类') category = '默认分类';
		return {
			category,
			title: titlePart[1]
		};
	}
};

module.exports = function(env){

	console.log('[upgrade]即将升级：0.3.0 -> 1.0.0');
	console.log('[upgrade]step1: 新建realm数据库');

	const realm = initRealm(env);


	let envPrefix = '';
	if(env === 'dev'){
		envPrefix = 'Dev-';
	}else if(env === 'test'){
		envPrefix = 'Test-';
	}
	console.log('[upgrade]env:%s', env);

	console.log('[upgrade]step2: 笔记数据迁移');
	const metaKey = `TooNote-LocalStorage-Key-${envPrefix}meta.json`;
	console.log('[upgrade]准备读取meta');
	let metaStr = localStorage.getItem(metaKey);
	// 有可能是新安装的用户
	if(!metaStr){
		console.log('[upgrade]没有meta信息');
		console.log('[upgrade]0.3.0 -> 1.0.0升级成功');
		return;
	}

	let meta = JSON.parse(localStorage.getItem(metaKey));
	console.log('[upgrade]读取meta成功');

	const notes = [];
	const categories = [];
	const notebooks = [];
	let noteOrder = 100;
	let categoryOrder = 100;
	let notebookOrder = 100;

	realm.write(() => {
		meta.notebooks.forEach(function(notebook){
			console.log('[upgrade]notebook:%s', notebook.title);
			const notebookData = {
				id: notebook.id,
				title: notebook.title,
				order: notebookOrder,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			console.log('[upgrade]准备写入realm');
			const newNotebook = realm.create('Notebook', notebookData);
			console.log('[upgrade]写入realm成功');
			/* console.log('[upgrade]增加notebook.createdAt');
			notebook.createdAt = +notebook.id;
			console.log('[upgrade]notebook.id -> uuid');
			notebook.id = uuid.v4(); */

			notebook.notes.forEach(function(note){
				console.log('[upgrade]迁移笔记：%s %s', note.id, note.title);
				const content = localStorage.getItem(`TooNote-LocalStorage-Key-${envPrefix}note-${note.id}.md`);
				const categoryAndTitle = getCategoryAndTitle(note.title);
				const noteData = {
					id: note.id,
					title: categoryAndTitle.title,
					content,
					order: noteOrder,
					localVersion: note.localVersion,
					remoteVersion: note.remoteVersion,
					createdAt: new Date(note.createdAt),
					updatedAt: new Date()
				};
				console.log('[upgrade]准备写入realm');
				const newNote = realm.create('Note', noteData);
				console.log('[upgrade]处理分类');
				let existCategory = realm.objects('Category').filtered(`title="${categoryAndTitle.category}"`)[0];
				if(!existCategory){
					console.log('[upgrade]分类 %s 不存在，准备新建', categoryAndTitle.category);
					existCategory = realm.create('Category', {
						id: uuid.v4(),
						title: categoryAndTitle.category,
						order: categoryOrder,
						notes: [newNote],
						createdAt: new Date(),
						updatedAt: new Date()
					});
					newNotebook.categories.push(existCategory);
					categoryOrder += 100;
				}else{
					console.log('[upgrade]分类 %s 存在', categoryAndTitle.category);
					existCategory.notes.push(newNote);
				}
				console.log('[upgrade]分类处理完毕');
				newNotebook.notes.push(newNote);

				console.log('[upgrade]处理分类和笔记本创建时间');
				if(newNote.createdAt < newNotebook.createdAt){
					newNotebook.createdAt = newNote.createdAt;
				}
				if(newNote.createdAt < existCategory.createdAt){
					existCategory.createdAt = newNote.createdAt;
				}

				noteOrder += 100;
			});

			notebooks.push(newNotebook);
			notebookOrder += 100;
		});
	});
	console.log('[upgrade]笔记内容迁移完毕');

	console.log('[upgrade]step3: 配置数据迁移');

	const configKey = `TooNote-LocalStorage-Key-${envPrefix}config`;
	const config = JSON.parse(localStorage.getItem(configKey) || '{}');
	console.log('[upgrade]step3: 配置：', config);
	realm.write(() => {
		realm.create('Config', {
			key: 'cloudToken',
			value: JSON.stringify(config.cloudToken)
		});
		realm.create('Config', {
			key: 'dataVersion',
			value: JSON.stringify('1.0.0')
		});
		if(config.lastOpenNoteId){
			const note = realm.objects('Note').filtered(`id="${config.lastOpenNoteId}"`)[0];
			if(note){
				realm.create('Config', {
					key: 'lastState',
					value: JSON.stringify({
						noteId: config.lastOpenNoteId,
						notebookId: note.notebook[0].id
					})
				}, true);
			}
		}
	});
	console.log('[upgrade]配置升级成功', config);

	console.log('[upgrade]step4: 升级附件');
	const attachmentRegexp = /!\[(.*)\]\((.*)\)/g;
	realm.write(() => {
		realm.objects('Note').forEach((note) => {
			note.content = note.content.replace(attachmentRegexp, (match, title, localPath) => {
				if(/^tnattach/.test(localPath)) return match;
				localPath = decodeURIComponent(localPath);
				const attachment = realm.create('Attachment', {
					id: uuid.v4(),
					filename: path.basename(localPath),
					ext: path.extname(localPath),
					size: fs.statSync(localPath).size,
					createdAt: note.createdAt,
					updatedAt: new Date(),
					localPath,
					remotePath: '',
				});
				note.attachments.push(attachment);
				return `![${title}](tnattach://${attachment.id}${attachment.ext})`;
			});
		});
	});
	console.log('[upgrade]升级附件成功');


	console.log('[upgrade]0.3.0 -> 1.0.0升级成功');

};
