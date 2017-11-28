import {init, getResults, updateResult, createResult} from '../storage/realm';
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
	}
};

console.time('initRenderData');
init();
results = {
	Notebook: getResults('Notebook'),
	Category: getResults('Category'),
	Note: getResults('Note'),
};
for(let schema in results){
	results[schema].addListener((puppies, changes) => {
		console.log('changed', puppies, changes);
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
export const updateCurrentNote = throttle((data) => {
	let hasChanged = false;
	for(let key in data){
		if(data[key] !== uiData.currentNote.data[key]){
			hasChanged = true;
		}
	}
	console.log(hasChanged);
	if(!hasChanged) return;
	console.time('updateNote');
	updateResult('Note', {
		...data,
		id: uiData.currentNote.data.id,
	});
	renderData.updateCurrentNote(uiData, data);
	console.timeEnd('updateNote');
}, 500);

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
	const newNoteId = createResult('Note', data, [{
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
