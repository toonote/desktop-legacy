import Store from '../api/store/index';

let store = new Store();
const CONFIG_FILE = '/config';

let getAllConfig = async function(){
	let configStr = await store.readFile(CONFIG_FILE);
	if(!configStr) configStr = '{}';
	let config = JSON.parse(configStr);
	return config;
};

let setAllConfig = async function(config){
	await store.writeFile(CONFIG_FILE, JSON.stringify(config));
};

export async function getConfig(key){
	let config = await getAllConfig();
	return config[key];
}

export async function setConfig(key, value){
	let config = await getAllConfig();
	config[key] = value;
	await setAllConfig(config);
}
