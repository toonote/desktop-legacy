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
		width: 1000,
		height: 600,
		'use-content-size':true,
		resizable:true,
		icon: __dirname + '/images/logo_window.png'
	});
	mainWindow.loadURL('file://' + __dirname + '/editor.html');
	mainWindow.on('closed', function() {
		mainWindow = null;
	});

	// 开发环境打开调试工具
	if(!/app$/.test(__dirname)){
		mainWindow.openDevTools();
	}
});

/*var ipc = require('ipc');
ipc.on('dialog',function(event,arg) {
	if(arg === 'folderPath'){
		var dialog = require('dialog');
		event.returnValue = dialog.showOpenDialog({
			properties: ['openDirectory']
		});
	}
});

ipc.on('window',function(event,arg){
	if(arg === 'close'){
		console.log('enter close');
		mainWindow.close();
		event.returnValue = true;
	}
});*/
