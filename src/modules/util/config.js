import realm from '../storage/realm';
const SCHEMA = 'Config';
let configResults;

const getConfigResults = function(){
	if(!configResults){
		configResults = realm.getResults(SCHEMA);
	}
	return configResults;
};

/**
 * 获取配置项
 * @param {string} key 配置项
 * @returns {*} 配置项的值
 */
export function getConfig(key){
	const configResults = getConfigResults();
	const config = configResults.filtered(`key="${key}"`);
	if(!config.length) return undefined;
	return JSON.parse(config[0].value);
}

/**
 * 设置配置项
 * @param {string} key 配置项
 * @param {string} value 配置项的值
 */
export function setConfig(key, value){
	realm.updateResult(SCHEMA, {
		key,
		value: JSON.stringify(value)
	});
}

/**
 * 批量设置配置项
 * @param {Object} obj 配置项键值对
 */
export function setConfigBulk(obj){
	let arr = [];
	for(let key in obj){
		arr.push({
			key,
			value: JSON.stringify(obj[key])
		});
	}
	realm.updateResult(SCHEMA, arr);
}
