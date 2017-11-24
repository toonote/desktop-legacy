// @ts-check

import {getConfig, setConfig} from '../util/config';
import {getAgent} from '../util/http';

const URL_BASE = 'https://api.xiaotu.io';
const agent = getAgent(URL_BASE);

// 用户信息
export let userData = {};

// 显示登录窗口
const oauth = async function(){
	let BrowserWindow = require('electron').remote.BrowserWindow;

	let loginWindow = new BrowserWindow({
		width: 400,
		height: 650
	});
	let webContents = loginWindow.webContents;
	// 加载空白页，显示loading
	// loginWindow.loadURL('about:blank');
	loginWindow.loadURL(`file://${__dirname}/login.html`);
	// webContents.executeJavaScript('document.write("正在登录...")');
	// 打开调试工具
	if(DEBUG){
		loginWindow.openDevTools();
	}

	return await new Promise((resolve, reject) => {
		// 加载完成后处理登录逻辑
		webContents.on('dom-ready', () => {
			let url = webContents.getURL();
			let parsedUrl = require('url').parse(url, true);
			if(parsedUrl.pathname !== '/oauth/clientToken') return;
			let token = parsedUrl.query.token;
			if(!token){
				reject(new Error('登录失败'));
				return;
			}
			console.log('[Login] get token', token);
			loginWindow.close();
			resolve(token);
		});
	});
};

// 登录
export async function login(isForce = false){
	let token;
	if(isForce){
		token = await oauth();
	}else{
		token = getConfig('token');
	}
	if(token){
		await initUserByToken(token);
	}
}

// 用户初始化
export async function init(){
	const token = getConfig('token');
	if(!token){
		return false;
	}
	return initUserByToken(token);
}

// 使用token初始化用户信息
export async function initUserByToken(token){
	return agent.get('/user/info').then((data) => {
		userData = data.data;
		return data.data;
	}).catch((e) => {
		if(e.response && e.response.status === 403){
			login(true);
		}
	});
}
