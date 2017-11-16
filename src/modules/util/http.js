// import {machineIdSync} from 'node-machine-id';
import {getConfig} from './config';
import axios from 'axios';
const machineId = getConfig('machineId');

export function getAgent(baseUrl, options = {}, headers = {}){
	options.headers = headers;
	options.headers['X-Uuid'] = machineId;
	const agent = axios.create(Object.assign({}, {
		baseURL: baseUrl,
		timeout: 10 * 1000
	}, options));
	agent.interceptors.request.use(function (config) {
		let token = getConfig('cloudToken');
		if(token){
			config.headers['X-TooNote-Token'] = token;
		}
		return config;
	}, function (error) {
		return Promise.reject(error);
	});
	return agent;
}
