import debug from '../util/debug';
const logger = new debug('cloud:request');
import { getAgent } from '../util/http';
const URL_BASE = DEBUG ? 'https://test-api.xiaotu.io' : 'https://api.xiaotu.io';
export const agent = getAgent(URL_BASE);

export async function get(url, params = {}){
	let response = await agent.get(url, {
		params
	});
	if(response.status !== 200 || !response.data || response.data.code !== 0){
		logger('error getting url' + url, response);
		return false;
	}
	return response.data.data;
}

export async function getAll(schema, params = {}){
	let page = 1;
	let limit = 10;
	let result = [];
	while(1){
		let data = await get('/api/v2/' + schema, Object.assign({
			page,
			limit,
		}, params));
		if(data.length){
			result = result.concat(data);
		}
		if(data.length < limit){
			break;
		}
		page++;
	}
	return result;
}
