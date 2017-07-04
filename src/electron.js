var electron = require('electron');

var app = electron.app;
var BrowserWindow = electron.BrowserWindow;

// require('crash-reporter').start();

var mainWindow = null;

app.on('window-all-closed', function() {
	app.quit();
});

app.on('ready', function() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		'use-content-size':true,
		resizable:true,
		icon: __dirname + '/images/logo@64.png'
	});
	mainWindow.loadURL('file://' + __dirname + '/main.html');
	mainWindow.on('closed', function() {
		mainWindow = null;
	});

	// 开发环境打开调试工具
	if(!/app$/.test(__dirname) && +process.env.NO_DEBUG !== 1){
		mainWindow.openDevTools();
		let devInstaller = require('electron-devtools-installer');
		// import installExtension, { REACT_DEVELOPER_TOOLS } from ;

		devInstaller.default(devInstaller.VUEJS_DEVTOOLS)
			.then((name) => console.log(`Added Extension:  ${name}`))
			.catch((err) => console.log('An error occurred: ', err));
	}
});
