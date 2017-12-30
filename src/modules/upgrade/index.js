import {getConfig, setConfig} from '../util/config';
import path from 'path';

function getLocalStorageKey(path){
	let Env = '';
	if(DEBUG){
		Env = 'Dev-';
	}else if(TEST){
		Env = 'Test-';
	}
	return 'TooNote-LocalStorage-Key-' + Env + path;
}

export default function(){
	let dataVersion = getConfig('dataVersion');
	// 如果取不到，则可能是<1.0.0版本，在localStorage中
	if(!dataVersion){
		const localStorageKey = getLocalStorageKey('config');
		const config = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
		dataVersion = config.dataVersion;
		if(!config.dataVersion){
			// 0.2.0 -> 0.3.0是第一个需要做数据升级的
			dataVersion = '0.2.0';
		}
	}

	let versions = global['require'](path.join(
		require('electron').remote.app.getAppPath(),
		'/docs/upgrade/versions.json'
	));
	let dataVersionIndex = versions.indexOf(dataVersion);
	if(dataVersionIndex === -1){
		alert('您之前使用过更高版本软件创建过数据，使用过程中可能存在数据不兼容的情况。');
		return;
	}else if(dataVersionIndex === versions.length - 1){
		// 当前版本，不需要升级
		return;
	}

	// 准备跑升级脚本
	if(!TEST){
		alert('您已升级到新版本，即将进行数据更新，请耐心等待。');
	}

	let upgradeList = versions.slice(dataVersionIndex + 1);
	let upgradeItem;
	while(upgradeItem = upgradeList.shift()){
		let scriptPath = path.join(
			require('electron').remote.app.getAppPath(),
			`/docs/upgrade/scripts/${upgradeItem}.js`
		);
		console.log(`即将升级到${upgradeItem}`);
		let env = '';
		if(DEBUG){
			env = 'dev';
		}else if(TEST){
			env = 'test';
		}
		global['require'](scriptPath)(env);
		setConfig('dataVersion', upgradeItem);
	}
}
