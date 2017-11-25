import {init, getResults} from '../storage/realm';
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
