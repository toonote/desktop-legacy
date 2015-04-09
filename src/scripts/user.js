var remote = require('remote');
var AV = require('avoscloud-sdk').AV;
AV.initialize("pnj0o24lytzmcaoebtu3uoynwyuqqs687ch3nxpih0i45qid", "ce3286s9l40kyj5erom2sjlc22tyqku6tn3na3v8s6h17jrs");

var queryUser = function(email, callback){
	var query = new AV.Query(AV.User);
	query.equalTo('username', email);
	query.find({
		success: function(users) {
			callback(null, !!users.length);
		},
		error: function(users, err){
			callback(err);
		}
	});
};

var queryUserCallback = function(err, result){
	var isRegistered = true;
	if(!err && !result){
		isRegistered = false;
	}
	var ipc = require('ipc');
	ipc.send('loginCallback.queryUser',isRegistered);
};

var bindEvents = function(){
	var ipc = remote.require('ipc');
	ipc.on('login.queryUser',function(e, email){
		console.log('bindEvents');
		queryUser(email, queryUserCallback);
	});
};


exports.login = function(){

	var BrowserWindow = remote.require('browser-window');
	var loginWindow = new BrowserWindow({
		width: 400,
		height: 300
	});
	loginWindow.loadUrl('file://' + __dirname + '/../login.html');

	if(!/app$/.test(__dirname)){
		loginWindow.openDevTools();
	}

	bindEvents();
};

