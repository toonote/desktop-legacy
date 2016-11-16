const login = {};

login.doLogin = function(){
	return new Promise((resolve, reject) => {
		let BrowserWindow = require('electron').remote.BrowserWindow;

		let loginWindow = new BrowserWindow({
			width: 400,
			height: 650
		});
		let webContents = loginWindow.webContents;
		// 加载空白页，显示loading
		loginWindow.loadURL('about:blank');
		webContents.executeJavaScript('document.write("正在登录...")');
		// 打开调试工具
		if(DEBUG){
			loginWindow.openDevTools();
		}

		// 加载完成后处理登录逻辑
		webContents.on('dom-ready', () => {
			let url = webContents.getURL();
			console.log(url, arguments);
			loginWindow = null;
		});
		loginWindow.loadURL('http://localhost:11118/oauth/redirect/github?client=mac');
		console.log(loginWindow);
	});
};

export default login;
