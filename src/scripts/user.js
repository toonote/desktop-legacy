var AV = require('avoscloud-sdk').AV;
AV.initialize("pnj0o24lytzmcaoebtu3uoynwyuqqs687ch3nxpih0i45qid", "ce3286s9l40kyj5erom2sjlc22tyqku6tn3na3v8s6h17jrs");

exports.login = function(){

	var remote = require('remote');
	var BrowserWindow = remote.require('browser-window');
	var loginWindow = new BrowserWindow({
		width: 400,
		height: 300
	});
	loginWindow.loadUrl('file://' + __dirname + '/../login.html');

	if(!/app$/.test(__dirname)){
		loginWindow.openDevTools();
	}

};

