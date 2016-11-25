import Store from '../api/store/index';
import axios from 'axios';
import {getConfig} from './config';
const store = new Store();

const API_PATH = '/api/v1';
let URL_BASE = 'https://toonote.113.im';
if(DEBUG){
	URL_BASE = 'http://localhost:11118';
}
let agent;

class CloudApi{
	constructor(options){
		this.model = options.model;
		this._modelUrl = `${URL_BASE}${API_PATH}/${this.model}`;
	}
	async create(data){
		let agent = await this._getAgent();
		return agent.post(this._modelUrl, data);
	}
	async update(data){
		let agent = await this._getAgent();
		return agent.put(this._modelUrl + `/${data.id}`, data);
	}
	async delete(id){
		let agent = await this._getAgent();
		return agent.delete(this._modelUrl + '/${id}', data);
	}
	async read(id){
		let agent = await this._getAgent();
		let url = this._modelUrl;
		if(id){
			url += `/${id}`;
		}
		return agent.get(this._modelUrl, data);
	}
	async _getToken(){
		return await getConfig('cloudToken');
	}
	async _getAgent(){
		let token = await this._getToken();
		if(!this._agent){
			this._agent = axios.create({
				baseURL: URL_BASE,
				timeout: 10*1000
			});
		}
		// 设置token
		this._agent.defaults.headers.common['X-TooNote-Token'] = token;
		return this._agent;
	}
};

export default CloudApi;
