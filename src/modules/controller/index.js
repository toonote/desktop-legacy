import {init, getResults} from '../storage/realm';
import {update} from './renderData';
import {throttle} from 'lodash';

let results;
let updateRenderData = throttle(update, 16, {
	leading: false
});

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

export const uiData = {
	notebookList: []
};
