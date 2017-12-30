// 0.2.0 -> 0.3.0升级脚本
const path = require('path');
const uuid = require('uuid');
const Realm = require('realm');

const ConfigSchema = {
	name: 'Config',
	primaryKey: 'key',
	properties: {
		key: 'string',
		value: 'string'
	}
};

const NotebookSchema = {
	name: 'Notebook',
	primaryKey: 'id',
	properties: {
		id: 'string',
		title: 'string',
		order: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		categories: 'Category[]',
		notes: 'Note[]'
	}
};

const CategorySchema = {
	name: 'Category',
	primaryKey: 'id',
	properties: {
		id: 'string',
		title: 'string',
		order: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		notes: 'Note[]',
		notebook: {
			type: 'linkingObjects',
			objectType: 'Notebook',
			property: 'categories'
		}
	}
};

const AttachmentSchema = {
	name: 'Attachment',
	primaryKey: 'id',
	properties: {
		id: 'string',
		filename: 'string',
		ext: 'string',
		size: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		localPath: 'string',
		remotePath: 'string',
		note: {
			type: 'linkingObjects',
			objectType: 'Note',
			property: 'attachments'
		}
	}
};

const NoteSchema = {
	name: 'Note',
	primaryKey: 'id',
	properties: {
		id: 'string',
		title: 'string',
		content: 'string',
		order: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		localVersion: 'int',
		remoteVersion: 'int',
		attachments: 'Attachment[]',
		versions: {
			type: 'linkingObjects',
			objectType: 'Version',
			property: 'notes'
		},
		category: {
			type: 'linkingObjects',
			objectType: 'Category',
			property: 'notes'
		},
		notebook: {
			type: 'linkingObjects',
			objectType: 'Notebook',
			property: 'notes'
		}
	}
};

const VersionSchema = {
	name: 'Version',
	primaryKey: 'id',
	properties: {
		id: 'string',
		message: 'string',
		createdAt: 'date',
		updatedAt: 'date',
		notes: 'Note[]'
	}
};

const VersionNoteContentSchema = {
	name: 'VersionNoteContent',
	primaryKey: 'id',
	properties: {
		id: 'string',
		noteId: 'string',
		versionId: 'string',
		content: 'string',
		createdAt: 'date',
		updatedAt: 'date',
	}
};

const TaskSchema = {
	name: 'Task',
	primaryKey: 'id',
	properties: {
		id: 'string',
		type: 'string',
		priority: 'int',
		targetId: 'string',
		data: 'string',
		status: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		log: 'string[]',
	}
};

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
			ConfigSchema,
			NotebookSchema,
			CategorySchema,
			NoteSchema,
			AttachmentSchema,
			VersionSchema,
			VersionNoteContentSchema,
			TaskSchema
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
	}else{
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
				key: 'cloundToken',
				value: config.cloudToken
			});
			realm.create('Config', {
				key: 'dataVersion',
				value: '1.0.0'
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
	}

	console.log('[upgrade]0.3.0 -> 1.0.0升级成功');

};
