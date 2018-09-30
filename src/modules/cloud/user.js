// @ts-check

import {getConfig, setConfig} from '../util/config';
import {getAgent} from '../util/http';
import debug from '../util/debug';
import eventHub, { EVENTS } from '../util/eventHub';

const logger = debug('user:module');

const URL_BASE = DEBUG ? 'https://test-api.xiaotu.io' : 'https://api.xiaotu.io';
let agent;

// 用户信息
export const userData = {
	data: {}
};

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
	let query = '';
	if(DEBUG){
		query = '?debug';
	}
	loginWindow.loadURL(`file://${__dirname}/login.html${query}`);
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
		token = getConfig('cloudToken');
	}
	if(token){
		await initUserByToken(token);
	}
}

// 用户初始化
export async function init(){
	const token = getConfig('cloudToken');
	logger('token:' + token);
	if(!token){
		return false;
	}
	return initUserByToken(token);
}

// 使用token初始化用户信息
export async function initUserByToken(token){
	if(!agent){
		agent = getAgent(URL_BASE);
	}
	logger('ready to get userInfo');
	return agent.get('/user/info').then((data) => {
		logger('get userInfo success', data);
		userData.data = data.data;
		eventHub.emit(EVENTS.USER_LOGIN, userData.data);
		return data.data;
	}).catch((e) => {
		logger('get userInfo failed', e);
		eventHub.emit(EVENTS.USER_LOGIN_ERROR);
		if(e.response && e.response.status === 403){
			login(true);
		}
	});
}
