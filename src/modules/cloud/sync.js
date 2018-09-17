import eventHub, { EVENTS } from '../util/eventHub';
import debug from '../util/debug';
import { getResults, createResult, updateResult, deleteResult, createReverseLink } from '../storage/realm/index';
import { getConfig, setConfig } from '../util/config';
import * as request from './request';
const agent = request.agent;
const logger = new debug('cloud:sync');

let isLogin = false;

export function init(){
	logger('init');
	eventHub.on(EVENTS.USER_LOGIN, (userData) => {
		logger('on USER_LOGIN');
		isLogin = userData.id;
		doSync();
	});

	// 同步任务运行
	/* eventHub.on(EVENTS.TASK_RUN, (task) => {
		if(!isLogin) return;
		logger('on TASK_RUN');
	}); */
}

const dealDeleteInChange = function(change){
	if(change.action === 'delete'){
		const schemaName = change.targetType;
		deleteResult(schemaName, change.targetId);
		logger('delete %s: %s', schemaName, change.targetId);
	}
};

const writeVersion = function(version, changes, noteContentList = []){
	let parentVersion;
	const parentId = version.parentId;
	if(parentId){
		parentVersion = getResults('Version').filtered(`id="${parentId}"`)[0];
	}
	// 将changes中的变更在本地重做一遍
	// 修改和新增的其实不用做，因为拉回来的版本数据中肯定有
	// 删除的需要单独处理一下
	// 修改的数据结构如下：
	/* change = {
		action: 'create|edit|delete',
		targetType: 'Note|Category|Notebook',
		targetId: 'xxxxxx',
		data: {
			title: 'abc',
			categoryId: 'xxxxxx'
		}
	}; */
	changes.forEach((change) => {
		dealDeleteInChange(change);
	});

	const versionData = {
		id: version.id,
		message: version.message,
		createdAt: version.createdAt,
		updatedAt: version.updatedAt,
		parentVersion,
		changes: JSON.stringify(changes.map((change) => {
			return {
				targetType: change.targetType,
				targetId: change.targetId,
				action: change.action,
				data: JSON.parse(change.data),
			};
		})),
		notes: [],
		categories: [],
		notebooks: []
	};
	const linkMap = {
		Note: 'notes',
		Category: 'categories',
		Notebook: 'notebooks'
	};

	// 如果反向链接的目标不存在了……那么，反向链接建立不了？
	// 从版本上看，笔记就消失了？！
	changes.forEach((change) => {
		const target = getResults(change.targetType).filtered(`id="${change.targetId}"`)[0];
		if(target){
			versionData[linkMap[change.targetType]].push(target);
		}
	});
	updateResult('Version', versionData);

	// 写入笔记历史版本内容
	noteContentList.forEach((noteContent) => {
		updateResult('VersionNoteContent', {
			id: noteContent.id,
			noteId: noteContent.noteId,
			versionId: noteContent.versionId,
			content: noteContent.content,
			createdAt: noteContent.createdAt,
			updatedAt: noteContent.updatedAt,
		});
	});

	// 设置共识版本
	setConfig('commonVersion', version.id);
};

const getVersionChanges = async function(versionId){
	return await request.getAll('versionChange', {
		where: JSON.stringify({
			versionId: versionId
		})
	});
};

const downloadAllNotebook = async function(notebookIds){
	let params = {};
	if(notebookIds){
		params = {
			where: {
				id: notebookIds
			}
		};
	}
	const data = await request.getAll('notebook', params);

	updateResult('Notebook', data.map((notebook) => {
		return {
			id: notebook.id,
			title: notebook.title,
			order: notebook.order,
			createdAt: new Date(notebook.createdAt),
			updatedAt: new Date(notebook.updatedAt),
		};
	}));
};

const downloadAllCategory = async function(categoryIds){
	let params = {};
	if(categoryIds){
		params = {
			where: {
				id: categoryIds
			}
		};
	}
	const data = await request.getAll('category', params);
	updateResult('Category', data.map((category) => {
		return {
			id: category.id,
			title: category.title,
			order: category.order,
			createdAt: new Date(category.createdAt),
			updatedAt: new Date(category.updatedAt)
		};
	}));

	for(let i = 0; i < data.length; i++){
		const remoteCategory = data[i];
		const category = getResults('Category').filtered(`id="${remoteCategory.id}"`)[0];
		// todo:删除反向链接
		createReverseLink(category, [{
			name: 'Notebook',
			id: remoteCategory.notebookId,
			field: 'categories'
		}]);
	}

};

const downloadAllNote = async function(noteIds){
	let params = {};
	if(noteIds){
		params = {
			where: {
				id: noteIds
			}
		};
	}
	const data = await request.getAll('note', params);

	// 获取内容
	for(let i = 0; i < data.length; i++){
		const id = data[i].id;
		const remoteNote = await request.get('/api/v2/note/' + id);
		updateResult('Note', {
			id: remoteNote.id,
			title: remoteNote.title,
			content: remoteNote.content,
			order: remoteNote.order,
			createdAt: new Date(remoteNote.createdAt),
			updatedAt: new Date(remoteNote.updatedAt),
			localVersion: remoteNote.version,
			remoteVersion: remoteNote.version
		});

		// todo:删除反向链接
		// 反向链接
		const note = getResults('Note').filtered(`id="${remoteNote.id}"`)[0];
		const reverseLink = [];
		if(remoteNote.notebookId){
			reverseLink.push({
				name: 'Notebook',
				id: remoteNote.notebookId,
				field: 'notes'
			});
		}
		if(remoteNote.categoryId){
			reverseLink.push({
				name: 'Category',
				id: remoteNote.categoryId,
				field: 'notes'
			});
		}
		if(reverseLink.length){
			createReverseLink(note, reverseLink);
		}
	}

};

const downloadAllVersion = async function(){
	const data = await request.get('/api/v2/version');

	// 获取内容
	for(let i = 0; i < data.length; i++){
		const version = data[i];
		const remoteVersionChanges = await getVersionChanges(version.id);
		const remoteVersionNoteContentList = await request.getAll('versionNoteContent', {
			where: JSON.stringify({
				versionId: version.id
			})
		});

		writeVersion(version, remoteVersionChanges, remoteVersionNoteContentList);

	}
};

const downloadAllAfterVersion = async function(commonVersionId){
	const newVersions = await request.get('/api/v2/version', {
		commonVersionId
	});

	// 稍后需要去拉取的id列表
	const noteIds = [];
	const categoryIds = [];
	const notebookIds = [];

	// 临时数组，存储与newVersions对应的changes
	const tmpChanges = [];
	// 临时数组，存储与newVersions对应的noteContent
	const tmpNoteContents = [];

	for(let i = 0; i < newVersions.length;i++){
		const version = newVersions[i];
		logger('got new version', version);
		const versionChanges = await getVersionChanges(version.id);
		tmpChanges[i] = versionChanges;
		versionChanges.forEach((change) => {
			dealDeleteInChange(change);
			if(change.action === 'delete') return;
			if(change.targetType === 'Note'){
				if(noteIds.indexOf(change.targetId) === -1){
					noteIds.push(change.targetId);
				}
			}else if(change.targetType === 'Category'){
				if(categoryIds.indexOf(change.targetId) === -1){
					categoryIds.push(change.targetId);
				}
			}else if(change.targetType === 'Notebook'){
				if(notebookIds.indexOf(change.targetId) === -1){
					notebookIds.push(change.targetId);
				}
			}
		});
		tmpNoteContents[i] = await request.getAll('versionNoteContent', {
			where: JSON.stringify({
				versionId: version.id
			})
		});
	}

	if(notebookIds.length){
		await downloadAllNotebook(notebookIds);
	}
	if(categoryIds.length){
		await downloadAllCategory(categoryIds);
	}
	if(noteIds.length){
		await downloadAllNote(noteIds);
	}

	for(let i = 0; i < newVersions.length;i++){
		writeVersion(newVersions[i], tmpChanges[i], tmpNoteContents[i]);
	}
};

const uploadAllAfterVersion = async function(versionId){
	let tmpVersion = getResults('Version').filtered(`id="${versionId}"`)[0];
	if(!tmpVersion){
		console.log('uploadAllAfterVersion error: no version of %s', versionId);
		return;
	}
	let childVersion = tmpVersion.childVersion[0];
	if(!childVersion){
		console.log('uploadAllAfterVersion success: no version after %s', versionId);
		return;
	}
	let versionList = [];
	let noteList = [];
	let categoryList = [];
	let notebookList = [];
	while(childVersion){
		versionList.push(childVersion);
		if(childVersion.notes.length){
			noteList = noteList.concat(childVersion.notes
				.map((note) => note)
				.filter((note) => !noteList.some((noteInList) => {
					return noteInList.id === note.id;
				}))
			);
		}
		if(childVersion.categories.length){
			categoryList = categoryList.concat(childVersion.categories
				.map((category) => category)
				.filter((category) => !categoryList.some((categoryInList) => {
					return categoryInList.id === category.id;
				}))
			);
		}
		if(childVersion.notebooks.length){
			notebookList = notebookList.concat(childVersion.notebooks
				.map((notebook) => notebook)
				.filter((notebook) => !notebookList.some((notebookInList) => {
					return notebookInList.id === notebook.id;
				}))
			);
		}
		childVersion = childVersion.childVersion[0];
	}
	// 依次同步笔记本、分类、笔记
	let response;

	response = await agent.post('/api/v2/batchUploadNotebook', {
		data: notebookList.map((notebook) => {
			return {
				id: notebook.id,
				title: notebook.title,
				order: notebook.order,
				createdAt: notebook.createdAt,
				updatedAt: notebook.updatedAt,
			};
		})
	});
	if(response.status !== 200 || !response.data || response.data.code !== 0){
		logger('error upload notebook list', response);
		return;
	}

	response = await agent.post('/api/v2/batchUploadCategory', {
		data: categoryList.map((category) => {
			return {
				id: category.id,
				title: category.title,
				order: category.order,
				notebookId: category.notebook[0].id,
				createdAt: category.createdAt,
				updatedAt: category.updatedAt,
			};
		})
	});
	if(response.status !== 200 || !response.data || response.data.code !== 0){
		logger('error upload category list', response);
		return;
	}

	response = await agent.post('/api/v2/batchUploadNote', {
		data: noteList.map((note) => {
			return {
				id: note.id,
				title: note.title,
				content: note.content,
				order: note.order,
				// 旧版版本标识
				version: note.localVersion,
				categoryId: note.category[0].id,
				notebookId: note.notebook[0].id,
				createdAt: note.createdAt,
				updatedAt: note.updatedAt,
			};
		})
	});
	if(response.status !== 200 || !response.data || response.data.code !== 0){
		logger('error upload note list', response);
		return;
	}

	// 同步版本
	response = await agent.post('/api/v2/batchUploadVersion', {
		data: versionList.map((version) => {
			return {
				id: version.id,
				message: version.message,
				parentId: version.parentVersion.id,
				changes: version.changes,
				createdAt: version.createdAt,
				updatedAt: version.updatedAt,
			};
		})
	});
	if(response.status !== 200 || !response.data || response.data.code !== 0){
		logger('error upload version list', response);
		return;
	}

	// 同步历史版本笔记内容
	debugger;
	const versionIds = versionList.map((version) => version.id);
	const versionNoteContentList = getResults('VersionNoteContent')
		.filtered(versionIds.map((id) => `id="${id}"`).join(' or '));
	response = await agent.post('/api/v2/batchUploadVersionNoteContent', {
		data: versionNoteContentList.map((versionNoteContent) => {
			return {
				id: versionNoteContent.id,
				noteId: versionNoteContent.noteId,
				versionId: versionNoteContent.versionId,
				content: versionNoteContent.content,
				createdAt: versionNoteContent.createdAt,
				updatedAt: versionNoteContent.updatedAt,
			};
		})
	});
	if(response.status !== 200 || !response.data || response.data.code !== 0){
		logger('error upload version list', response);
		return;
	}

	// 设置共识版本
	setConfig('commonVersion', versionList[versionList.length - 1].id);

};

/**
 * 执行同步
 */
export async function doSync(){
	// todo:同步历史版本对应的笔记内容
	if(!isLogin) return;
	let commonVersion = getConfig('commonVersion');
	if(!commonVersion){
		// 没有共识版本，拉取所有数据
		logger('no commonVersion, ready to get all data');
		await downloadAllNotebook();
		await downloadAllCategory();
		await downloadAllNote();
		await downloadAllVersion();
		commonVersion = getConfig('commonVersion');
	}else{
		// 拉取共识版本之后的数据
		await downloadAllAfterVersion(commonVersion);
	}
	// 上传本地共识版本之后的数据
	await uploadAllAfterVersion(commonVersion);
}
