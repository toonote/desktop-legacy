// import Store from '../api/store/index';
import axios from 'axios';
import {machineIdSync} from 'electron-machine-id';
import {getConfig, setConfig} from './config';
// const store = new Store();
const login = {};

let URL_BASE = 'https://api.xiaotu.io';
if(DEBUG){
	// URL_BASE = 'http://localhost:11118';
}
let agent;

login.setToken = async function(token){
	await setConfig('cloudToken', token);
};

login.getToken = async function(){
	return await getConfig('cloudToken');
};

login.doLogin = async function(isAuto){
	let doOauth = () => {
		return new Promise((resolve, reject) => {
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

			// 加载完成后处理登录逻辑
			webContents.on('dom-ready', () => {
				let url = webContents.getURL();
				let parsedUrl = require('url').parse(url, true);
				if(parsedUrl.pathname !== '/oauth/clientToken') return;
				let token = parsedUrl.query.token;
				console.log('[Login] get token', token);
				loginWindow.close();
				this.setToken(token).then(() => {
					console.log('setTokenSuccess');
					this.initUser(token).then(resolve).catch(reject);
				});
			});
			// loginWindow.loadURL(URL_BASE + '/oauth/redirect/github?client=mac');
		});
	};
	let token = await this.getToken();
	if(token){
		try{
			return await this.initUser(token);
		}catch(e){
			if(isAuto){
				if(e.response && e.response.status === 403){
					login.doLogin();
				}
				return;
			}
			return doOauth();
		}
	}
	if(isAuto){
		return;
	}
	return doOauth();
};

// 使用token初始化用户信息
login.initUser = async function(token){
	if(!token){
		token = await this.getToken();
	}
	return new Promise((resolve, reject) => {
		if(!agent){
			agent = axios.create({
				baseURL: URL_BASE,
				timeout: 10 * 1000,
				headers: {
					'X-Uuid': machineIdSync({original:true})
				}
			});
		}
		// 设置token
		agent.defaults.headers.common['X-TooNote-Token'] = token;
		agent.get('/user/info').then((data) => {
			resolve(data.data);
		}).catch((err) => {
			reject(err);
		});
	});
};

export default login;
