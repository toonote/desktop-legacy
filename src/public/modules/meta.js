import util from './util';
import Store from '../api/store/index';

let meta = {};
let store = new Store(util.platform);

meta.getData = async function(){
	console.log('getMetaData');
	return await store.readFile('/meta.json');
};

meta.initData = async function(){
	var data = {
		recent:[],
		notebook:[{
			id:Date.now()+((Math.random()*10000)>>0),
			title:'TooNote',
			notes:[{
				id:Date.now()+((Math.random()*10000)>>0),
				title:'欢迎使用TooNote',
			}]
		}]
	};
	await store.writeFile('/meta.json',JSON.stringify(data));
	return data;
};

export default meta;
