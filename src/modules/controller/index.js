import {init, getResults} from '../storage/realm';
import * as renderData from './renderData';
import {throttle} from 'lodash';

let results;
let updateRenderData = throttle(renderData.update, 16, {
	leading: false
});

export const uiData = {
	notebookList: [],
	currentNotebook: {}
};

init().then(() => {
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
});


export function switchCurrentNotebook(notebookId){
	renderData.switchCurrentNotebook(results, uiData, notebookId);
}
