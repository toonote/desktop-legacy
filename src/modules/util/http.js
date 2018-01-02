// import {machineIdSync} from 'node-machine-id';
import {getConfig, setConfig} from './config';
import axios from 'axios';
import {machineIdSync} from 'node-machine-id';
import {version as appVersion} from '../../package.json';

export function getAgent(baseUrl, options = {}, headers = {}){
	options.headers = headers;
	let machineId = getConfig('machineId');
	if(!machineId){
		machineId = machineIdSync(true);
		setConfig('machineId', machineId);
	}
	options.headers['X-Uuid'] = machineId;
	const agent = axios.create(Object.assign({}, {
		baseURL: baseUrl,
		timeout: 10 * 1000
	}, options));
	agent.interceptors.request.use(function (config) {
		let token = getConfig('cloudToken');
		if(token){
			config.headers['X-TooNote-Token'] = token;
			config.headers['X-TooNote-Version'] = appVersion;
		}
		return config;
	}, function (error) {
		return Promise.reject(error);
	});
	return agent;
}
