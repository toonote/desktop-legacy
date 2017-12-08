import debug from '../util/debug';
import * as realm from '../storage/realm';
import * as renderData from './renderData';
import {getOrderNumber} from '../util/orderCalc';
import ioExportNote from './exportNote';
import ioCopyNote from './copyNote';
import {throttle} from 'lodash';

const logger = debug('controller:main');

let results;
let updateRenderData = throttle(renderData.update, 16, {
	leading: false
});

export const uiData = {
	notebookList: {
		data: []
	},
	currentNotebook: {
		data: {}
	},
	currentNote:{
		data: {}
	},
	currentNoteContent:{
		data: ''
	},
	searchNoteList:{
		data: []
	},
	layout:{
		data:{
			sidebar: true,
			editor: true,
			preview: true
		}
	}
};

console.time('initRenderData');
realm.init();
results = {
	Notebook: realm.getResults('Notebook'),
	Category: realm.getResults('Category'),
	Note: realm.getResults('Note'),
};
for(let schema in results){
	results[schema].addListener((puppies, changes) => {
		logger('realm data changed');
		logger(puppies);
		logger(changes);
		updateRenderData(results, uiData);
	});
}
console.timeEnd('initRenderData');

/**
 * 切换当前笔记本
 * @param {string} notebookId 笔记本id
 * @returns {void}
 */
export function switchCurrentNotebook(notebookId){
	console.time('switchCurrentNotebookData');
	renderData.switchCurrentNotebook(results, uiData, notebookId);
	// 切到第一篇笔记
	// todo:应该切到上次查看的笔记
	switchCurrentNote(uiData.currentNotebook.data.notes[0].id);
	console.timeEnd('switchCurrentNotebookData');
}

/**
 * 退出当前笔记本
 */
export function exitNotebook(){
	uiData.currentNotebook.data = {};
}

/**
 * 切换当前笔记
 * @param {string} noteId 笔记id
 * @returns {void}
 */
export function switchCurrentNote(noteId){
	console.time('switchCurrentNoteData');
	renderData.switchCurrentNote(results, uiData, noteId);
	console.timeEnd('switchCurrentNoteData');
}

/**
 * 更新当前笔记
 * @param {Object} 更新的数据
 * @returns {void}
 */
export const updateCurrentNote = throttle((data, isEditingHeading) => {
	let hasChanged = false;
	// 处理通过标题修改分类的情况
	if(data.content && !isEditingHeading){
		const firstLine = data.content.split('\n', 2)[0];
		if(!firstLine){
			data.title = '无标题';
		}else{
			const titlePart = firstLine.replace(/#/g, '')
				.trim().split('\\', 2);
			if(titlePart.length === 2){
				data.title = titlePart[1];
				const categoryTitle = titlePart[0].trim();
				logger('update note category to :', categoryTitle);
				updateCurrentNoteCategory(categoryTitle);
			}else{
				data.title = titlePart[0];
			}
		}
	}
	if(typeof data.content !== 'undefined' && data.content !== uiData.currentNoteContent.data){
		logger('content changed.');
		hasChanged = true;
	}
	if(!hasChanged){
		for(let key in data){
			if(key !== 'content' && data[key] !== uiData.currentNote.data[key]){
				logger(key + ' changed.');
				hasChanged = true;
			}
		}
	}
	logger('hasChanged', hasChanged, data);
	if(!hasChanged) return;
	console.time('updateNote');
	realm.updateResult('Note', {
		...data,
		id: uiData.currentNote.data.id,
	});
	renderData.updateCurrentNote(uiData, data);
	console.timeEnd('updateNote');
}, 500);

/**
 * 删除笔记
 * @param {string} noteId 笔记id
 * @returns {void}
 */
export function deleteNote(noteId){
	console.time('deleteNote');
	let isCurrentNote = noteId === uiData.currentNote.data.id;
	realm.deleteResult('Note', noteId);
	// renderData.deleteNote(results, uiData, noteId);
	// switchCurrentNote();
	if(isCurrentNote){
		logger('currentNote deleted, switching to new currentNote');
		switchCurrentNote(uiData.currentNotebook.data.notes[0].id);
	}
	console.timeEnd('deleteNote');
}

/**
 * 修改当前笔记的分类
 * @param {string} categoryTitle 新分类的标题
 */
export const updateCurrentNoteCategory = function(categoryTitle){
	if(categoryTitle === uiData.currentNote.data.category.title) return;
	console.time('updateCurrentNoteCategory');
	const currentNoteResult = results.Note.filtered(`id="${uiData.currentNote.data.id}"`)[0];
	const targetCategory = results.Category.filtered(`title="${categoryTitle}"`);
	let categoryId;
	// 如果分类不存在，则新建
	if(!targetCategory.length){
		categoryId = realm.createResult('Category', {
			title: categoryTitle,
			order: getOrderNumber({
				min: uiData.currentNote.data.category.order
			}),
			createdAt: new Date(),
			updatedAt: new Date(),
			notes: []
		}, [{
			name: 'Notebook',
			field: 'categories',
			id: uiData.currentNotebook.data.id
		}]);
	}else{
		categoryId = targetCategory[0].id;
	}

	realm.createReverseLink(currentNoteResult, [{
		name: 'Category',
		field: 'notes',
		id: categoryId
	}]);

	realm.removeReverseLink(currentNoteResult, [{
		name: 'Category',
		field: 'notes',
		id: uiData.currentNote.data.category.id
	}]);

	renderData.updateCurrentNoteCategory(results, uiData, categoryId);
	console.timeEnd('updateCurrentNoteCategory');

};

/**
 * 新建笔记
 * @param {Object} data 笔记数据
 */
export const newNote = function(data = {}){
	console.time('newNote');
	const currentNote = uiData.currentNote.data;
	data = Object.assign({
		title: '新笔记',
		content: '# 新笔记\n\n',
		order: getOrderNumber({
			min: currentNote.order
		}),
		localVersion: 1,
		remoteVersion: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	}, data);
	const newNoteId = realm.createResult('Note', data, [{
		name: 'Category',
		field: 'notes',
		id: currentNote.category.id,
	},{
		name: 'Notebook',
		field: 'notes',
		id: currentNote.notebook.id,
	}]);
	logger('newNoteId:' + newNoteId);
	renderData.update(results, uiData);
	switchCurrentNote(newNoteId);
	console.timeEnd('newNote');
};

/**
 * 切换组件的可视状态
 * @param {string} component 要切换的组件
 * @param {boolean} [value] 切换的值，如果不传，则当前值取反
 */
export const switchLayout = function(component, value){
	const oldValue = uiData.layout.data[component];
	if(typeof value === 'undefined'){
		value = !oldValue;
	}
	uiData.layout.data[component] = value;
};

/**
 * 搜索关键词
 * @param {string} keyword 关键词
 */
export const search = function(keyword){
	console.time('search');
	renderData.search(results, uiData, keyword);
	console.timeEnd('search');
};

/**
 * 导出当前笔记
 * @param {string} format 格式
 */
export const exportNote = function(format){
	console.time('exportNote');
	ioExportNote(format, uiData.currentNote.data.title, uiData.currentNoteContent.data).then(() => {
		console.timeEnd('exportNote');
	});
};

/**
 * 复制当前笔记
 * @param {string} format 格式
 */
export const copyNote = function(format){
	console.time('copyNote');
	ioCopyNote(format, uiData.currentNoteContent.data).then(() => {
		console.timeEnd('copyNote');
	});
};

export const updateNoteOrder = function(noteId, compareNoteOrder, compareDirection){
	console.time('updateNoteOrder');
	const config = {};
	if(compareDirection === 'up'){
		config.max = compareNoteOrder;
		// 取前一个最大的order
		let previousNote = results.Note.filtered(`order < ${compareNoteOrder}`).sorted('order', true);
		if(previousNote[0]){
			config.min = previousNote[0].order;
		}
	}else{
		config.min = compareNoteOrder;
		// 取后一个最小的order
		let nextNote = results.Note.filtered(`order > ${compareNoteOrder}`).sorted('order');
		if(nextNote[0]){
			config.max = nextNote[0].order;
		}
	}
	logger('ready to getOrderNumber', config);
	const newOrder = getOrderNumber(config);
	logger('newOrder:', newOrder);
	let updateData = {
		order: newOrder,
		id: noteId
	};
	realm.updateResult('Note', updateData);
	renderData.updateNote(uiData, updateData);
	console.timeEnd('updateNoteOrder');
};
