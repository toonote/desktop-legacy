var remote = require('remote');
var AV = require('avoscloud-sdk').AV;
AV.initialize("pnj0o24lytzmcaoebtu3uoynwyuqqs687ch3nxpih0i45qid", "ce3286s9l40kyj5erom2sjlc22tyqku6tn3na3v8s6h17jrs");
var userToken = localStorage.getItem('toonote_userToken');
if(userToken){
	AV.User.become(userToken,{
		success: function(user){
			console.log('login with Token:', user);
		},
		error: function(user, err){
			console.log('login with token error', user, err);
		}
	});
}
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

var registerUser = function(userInfo, callback){
	var user = new AV.User();
	// username为唯一标识
	user.set('username', userInfo.email);
	user.set('email', userInfo.email);
	user.set('password', userInfo.password);

	user.signUp(null, {
		success: function(user) {
			callback(null);
		},
		error: function(user, err) {
			callback(err);
		}
	});
};

var registerUserCallback = function(err, result){
	var isSuccess = false;
	if(!err){
		isSuccess = true;
	}
	var ipc = require('ipc');
	ipc.send('loginCallback.register',isSuccess);
};

var loginUser = function(userInfo, callback){
	AV.User.logIn(userInfo.email, userInfo.password, {
		success: function(user) {
			callback(null);
		},
		error: function(user, err) {
			callback(err);
		}
	});

};

var loginUserCallback = function(err, result){
	var currentUser = AV.User.current();
	localStorage.setItem('toonote_userToken',currentUser._sessionToken);
	var isSuccess = false;
	if(!err){
		isSuccess = true;
	}
	var ipc = require('ipc');
	ipc.send('loginCallback.login',isSuccess);
};



var bindEvents = function(){
	console.log('bindEvents');
	var ipc = remote.require('ipc');
	ipc.on('login.queryUser',function(e, email){
		queryUser(email, queryUserCallback);
	});
	ipc.on('login.doRegister',function(e, userInfo){
		registerUser(userInfo, registerUserCallback);
	});
	ipc.on('login.doLogin',function(e, userInfo){
		loginUser(userInfo, loginUserCallback);
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

