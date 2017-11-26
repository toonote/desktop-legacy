import {init, getResults, updateResult} from '../storage/realm';
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

export function switchCurrentNotebook(notebookId){
	console.time('switchCurrentNotebookData');
	renderData.switchCurrentNotebook(results, uiData, notebookId);
	console.timeEnd('switchCurrentNotebookData');
}

export function switchCurrentNote(noteId){
	console.time('switchCurrentNoteData');
	renderData.switchCurrentNote(results, uiData, noteId);
	console.timeEnd('switchCurrentNoteData');
}

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
