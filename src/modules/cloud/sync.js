import eventHub, { EVENTS } from '../util/eventHub';
import debug from '../util/debug';
import { getResults, createResult, updateResult, deleteResult, createReverseLink } from '../storage/realm/index';
import { getConfig } from '../util/config';
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

const syncAllNotebook = async function(){
	const response = await agent.get('/api/v2/notebook');
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

const syncAllCategory = async function(){
	const response = await agent.get('/api/v2/category');
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
		createReverseLink(category, [{
			name: 'Notebook',
			id: remoteCategory.notebookId,
			field: 'categories'
		}]);
	}

};

const syncAllNote = async function(){
	const response = await agent.get('/api/v2/note');
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

const syncAllVersion = async function(){
	const response = await agent.get('/api/v2/version');
	if(response.status !== 200 || !response.data.data || response.data.code !== 0){
		logger('error getting version list', response);
		return;
	}

	// 获取内容
	for(let i = 0; i < response.data.data.length; i++){
		const id = response.data.data[i].id;
		const message = response.data.data[i].message;
		const createdAt = response.data.data[i].createdAt;
		const updatedAt = response.data.data[i].updatedAt;

		const versionChangeResponse = await agent.get('/api/v2/versionChange', {
			params: {
				where: JSON.stringify({
					versionId: id
				})
			}
		});
		if(versionChangeResponse.status !== 200 || !versionChangeResponse.data.data || versionChangeResponse.data.code !== 0){
			logger('error getting versionChange item', versionChangeResponse);
			return;
		}
		const remoteVersionChanges = versionChangeResponse.data.data;

		let parentVersion;
		const parentId = response.data.data[i].parentId;
		if(parentId){
			parentVersion = getResults('Version').filtered(`id="${parentId}"`)[0];
		}

		const versionData = {
			id,
			message,
			createdAt,
			updatedAt,
			parentVersion,
			changes: JSON.stringify(remoteVersionChanges),
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
		remoteVersionChanges.forEach((change) => {
			const target = getResults(change.targetType).filtered(`id="${change.targetId}"`)[0];
			if(target){
				versionData[linkMap[change.targetType]].push(target);
			}
		});
		updateResult('Version', versionData);

	}
};

/**
 * 执行同步
 */
export async function doSync(){
	if(!isLogin) return;
	const commonVersion = getConfig('commonVersion');
	if(!commonVersion){
		logger('no commonVersion, ready to get all data');
		await syncAllNotebook();
		await syncAllCategory();
		await syncAllNote();
		await syncAllVersion();
	}else{
		// 有共识版本
		// step1 获取共识版本之后新的版本数据
		const response = await agent.get('/api/v2/version/diff', {
			params: {
				commonVersion
			}
		});
		if(response.status !== 200 || !response.data.data || response.data.code !== 0){
			logger('error getting version diff', response);
			return;
		}
		const newVersions = response.data.data.newVersions;
		logger('got newVersions', newVersions);

		// step2 写入版本数据
		const versions = [];
		const allChanges = {
			note:{
				add: [],
				edit: [],
				delete: []
			},
			category:{
				add: [],
				edit: [],
				delete: []
			},
			notebook:{
				add: [],
				edit: [],
				delete: []
			}
		};
		newVersions.forEach((version) => {

			const changes = JSON.parse(version.changes);
			if(changes && changes.length){
				changes.forEach((change) => {
					// todo:关联关系如何处理？
					allChanges[change.type][change.action] = {
						id: change.targetId,
						...change.data
					};
				});
			}
			updateResult('Note', allChanges.note.add.concat(allChanges.note.edit));
			deleteResult('Note', allChanges.note.delete.map((note)=>note.id));
			updateResult('Category', allChanges.category.add.concat(allChanges.category.edit));
			deleteResult('Category', allChanges.category.delete.map((category)=>category.id));
			updateResult('Notebook', allChanges.notebook.add.concat(allChanges.notebook.edit));
			deleteResult('Notebook', allChanges.notebook.delete.map((notebook)=>notebook.id));
			/* updateResult('Note', version.notes.forEach((note) => {
				return {
					id: note.id,
					title: note.title,
					order: note.order,
					createdAt: new Date(note.createdAt),
					updatedAt: new Date(note.updatedAt),
					remoteVersion: note.version
				};
			}));
			updateResult('Category', version.categories.forEach((category) => {
				return {
					id: category.id,
					title: category.title,
					order: category.order,
					createdAt: new Date(category.createdAt),
					updatedAt: new Date(category.updatedAt)
				};
			}));
			updateResult('Notebook', version.notebooks.forEach((notebook) => {
				return {
					id: notebook.id,
					title: notebook.title,
					order: notebook.order,
					createdAt: new Date(notebook.createdAt),
					updatedAt: new Date(notebook.updatedAt),
				};
			})); */
			versions.push({
				id: version.id,
				message: version.message,
				createdAt: new Date(version.createdAt),
				updatedAt: new Date(version.updatedAt)
			});
		});
		updateResult('Version', versions);

		// step3 发送新版本到服务端
	}
}
