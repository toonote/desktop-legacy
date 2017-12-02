import * as realm from '../storage/realm';
import * as renderData from './renderData';
import {throttle} from 'lodash';

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
		// console.log('changed', puppies, changes);
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
				// console.log('update note category to :', categoryTitle);
				updateCurrentNoteCategory(categoryTitle);
			}
		}
	}
	if(typeof data.content !== 'undefined' && data.content !== uiData.currentNoteContent.data){
		hasChanged = true;
	}
	if(!hasChanged){
		for(let key in data){
			if(data[key] !== uiData.currentNote.data[key]){
				hasChanged = true;
			}
		}
	}
	// console.log('hasChanged', hasChanged, data);
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
			order: 0,
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
		order: 0,
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
	updateRenderData(results, uiData);
	switchCurrentNote(newNoteId);
	console.timeEnd('newNote');
};
