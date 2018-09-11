import eventHub, { EVENTS } from '../util/eventHub';
import debug from '../util/debug';
import { getResults, createResult, updateResult, deleteResult, createReverseLink } from '../storage/realm/index';
import { getConfig, setConfig } from '../util/config';
import { getAgent } from '../util/http';

const logger = new debug('cloud:sync');

const URL_BASE = DEBUG ? 'https://test-api.xiaotu.io' : 'https://api.xiaotu.io';
const agent = getAgent(URL_BASE);

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

const writeVersion = function(version, changes){
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
				targetId: change.targetType,
				action: change.action,
				data: change.data,
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
	// 设置共识版本
	setConfig('commonVersion', version.id);
};

const getVersionChanges = async function(versionId){
	const versionChangeResponse = await agent.get('/api/v2/versionChange', {
		params: {
			where: JSON.stringify({
				versionId: versionId
			})
		}
	});
	if(versionChangeResponse.status !== 200 || !versionChangeResponse.data.data || versionChangeResponse.data.code !== 0){
		logger('error getting versionChange item', versionChangeResponse);
		return;
	}
	return versionChangeResponse.data.data;
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
	const response = await agent.get('/api/v2/notebook', {
		params
	});
	if(response.status !== 200 || !response.data.data || response.data.code !== 0){
		logger('error getting notebook list', response);
		return;
	}
	updateResult('Notebook', response.data.data.map((notebook) => {
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
	const response = await agent.get('/api/v2/category', {
		params
	});
	if(response.status !== 200 || !response.data.data || response.data.code !== 0){
		logger('error getting category list', response);
		return;
	}
	updateResult('Category', response.data.data.map((category) => {
		return {
			id: category.id,
			title: category.title,
			order: category.order,
			createdAt: new Date(category.createdAt),
			updatedAt: new Date(category.updatedAt)
		};
	}));

	for(let i = 0; i < response.data.data.length; i++){
		const remoteCategory = response.data.data[i];
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
	const response = await agent.get('/api/v2/note', {
		params
	});
	if(response.status !== 200 || !response.data.data || response.data.code !== 0){
		logger('error getting note list', response);
		return;
	}

	// 获取内容
	for(let i = 0; i < response.data.data.length; i++){
		const id = response.data.data[i].id;
		const noteResponse = await agent.get('/api/v2/note/' + id);
		if(noteResponse.status !== 200 || !noteResponse.data.data || noteResponse.data.code !== 0){
			logger('error getting note item', noteResponse);
			return;
		}
		const remoteNote = noteResponse.data.data;
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
	const response = await agent.get('/api/v2/version');
	if(response.status !== 200 || !response.data.data || response.data.code !== 0){
		logger('error getting version list', response);
		return;
	}

	// 获取内容
	for(let i = 0; i < response.data.data.length; i++){
		const version = response.data.data[i];
		const remoteVersionChanges = await getVersionChanges(version.id);

		writeVersion(version, remoteVersionChanges);
	}
};

const downloadAllAfterVersion = async function(commonVersionId){
	const response = await agent.get('/api/v2/version', {
		params: {
			commonVersionId
		}
	});
	if(response.status !== 200 || !response.data.data || response.data.code !== 0){
		logger('error getting version data after commonVersion', response);
		return;
	}

	const newVersions = response.data.data;

	// 稍后需要去拉取的id列表
	const noteIds = [];
	const categoryIds = [];
	const notebookIds = [];

	// 临时数组，存储与newVersions对应的changes
	const tmpChanges = [];

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
		writeVersion(newVersions[i], tmpChanges[i]);
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
		noteList = noteList.concat(childVersion.notes);
		categoryList = categoryList.concat(childVersion.categories);
		notebookList = notebookList.concat(childVersion.notebooks);
		childVersion = childVersion.childVersion[0];
	}
	// 依次同步笔记本、分类、笔记
	let response;

	response = await agent.put('/api/v2/batchUploadNotebook', {
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
	if(response.status !== 200 || !response.data.data || response.data.code !== 0){
		logger('error upload notebook list', response);
		return;
	}

	response = await agent.put('/api/v2/batchUploadCategory', {
		data: categoryList.map((category) => {
			return {
				id: category.id,
				title: category.title,
				order: category.order,
				notebookId: category.noteobok[0].id,
				createdAt: category.createdAt,
				updatedAt: category.updatedAt,
			};
		})
	});
	if(response.status !== 200 || !response.data.data || response.data.code !== 0){
		logger('error upload category list', response);
		return;
	}

	response = await agent.put('/api/v2/batchUploadNote', {
		data: noteList.map((note) => {
			return {
				id: note.id,
				title: note.title,
				content: note.content,
				order: note.order,
				// 旧版版本标识
				version: note.localVersion,
				categoryId: note.category[0].id,
				notebookId: note.noteobok[0].id,
				createdAt: note.createdAt,
				updatedAt: note.updatedAt,
			};
		})
	});
	if(response.status !== 200 || !response.data.data || response.data.code !== 0){
		logger('error upload note list', response);
		return;
	}

	// 同步版本
	response = await agent.put('/api/v2/batchUploadVersion', {
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
	if(response.status !== 200 || !response.data.data || response.data.code !== 0){
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
	const commonVersion = getConfig('commonVersion');
	if(!commonVersion){
		// 没有共识版本，拉取所有数据
		logger('no commonVersion, ready to get all data');
		await downloadAllNotebook();
		await downloadAllCategory();
		await downloadAllNote();
		await downloadAllVersion();
	}else{
		// 拉取共识版本之后的数据
		await downloadAllAfterVersion(commonVersion);
	}
	// 上传本地共识版本之后的数据
	await uploadAllAfterVersion(commonVersion);
}
