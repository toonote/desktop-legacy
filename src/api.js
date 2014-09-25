exports.oauth = function(provider,callback){

	var querystring = require('querystring');
	var url = require('url');
	// var request = require('request');
	var config = window.config;

	if(provider === 'vdisk'){

		var clientId = '2158443672';
		var clientSecret = '6d7ccd730f7778255a1c48859a0a5491';
		var redirectUrl = encodeURI('https://api.weibo.com/oauth2/default.html');

		if(config.oauth && config.oauth.vdisk && config.oauth.vdisk.accessToken){
			if(config.oauth.vdisk.expire > Date.now()){
				callback(null,config.oauth.vdisk.accessToken);
				return;
			}
		}

		var authWindow = window.open(
			'https://auth.sina.com.cn/oauth2/authorize?'+
			querystring.stringify({
				client_id:clientId,
				redirect_uri:redirectUrl,
				response_type:'token'
			}),
			'test',
			''
		);

		authWindow.webContents.on('did-finish-load',function(){
			var parsedUrl = url.parse(authWindow.getUrl(),true);
			console.log(parsedUrl);
			if(parsedUrl.host === 'api.weibo.com'){
				authWindow.close();
				if(!parsedUrl.hash){
					callback(new Error('auth error'));
					return;
				}
				var parsedHash = querystring.parse(parsedUrl.hash.substr(1,parsedUrl.hash.length-1));
				var accessToken = parsedHash.access_token;
				if(!config.oauth){
					config.oauth = {};
				}
				if(!config.oauth.vdisk){
					config.oauth.vdisk = {};
				}
				config.oauth.vdisk.accessToken = parsedHash.access_token;
				config.oauth.vdisk.expire = (parsedHash.expires_in - 1800) * 1000;
				config.oauth.vdisk.uid = parsedHash.uid;

				localStorage.setItem('config',JSON.stringify(config));
				console.log('accessToken',accessToken);
				callback(null,accessToken);
			}
		});
	}

};

exports.pullSync = function(provider,callback){
	var restler = require('restler');
	var querystring = require('querystring');
	var url = require('url');
	var config = window.config;
	if(provider === 'vdisk'){
		var accessToken = config.oauth.vdisk.accessToken;
		restler.get('https://api.weipan.cn/2/metadata/sandbox/?'+querystring.stringify({
			access_token:accessToken
		})).on('complete',function(body){
			var fileList = JSON.parse(body).contents;
			doPullSync(fileList,callback);
		});
	}

	function doPullSync(fileList,fileCallback){
		// 连接池，并行任务
		asyncThread(2,fileList,function(fileItem,callback){
			var remoteUpdateTime = new Date(fileItem.modified).getTime();
			restler.get('https://api.weipan.cn/2/files/sandbox'+fileItem.path+'?'+querystring.stringify({
				access_token:accessToken
			})).on('complete',function(body){
				var content = JSON.parse(new Buffer(body,'utf8').toString());
				// console.log(content);
				fileCallback(fileItem.path.replace(/^\//,''),remoteUpdateTime,content);
				callback();
			});
		});
	}
};

exports.syncNote = function(provider,id,content,callback){
	var restler = require('restler');
	var querystring = require('querystring');
	var url = require('url');
	var config = window.config;
	var fileContent = new Buffer(JSON.stringify(content),'utf8');
	if(provider === 'vdisk'){
		var accessToken = config.oauth.vdisk.accessToken;
		restler.post('https://upload-vdisk.sina.com.cn/2/files/sandbox/'+id+'?'+querystring.stringify({
		// restler.post('http://localhost:56789?'+querystring.stringify({
			access_token:accessToken
		}),{
			multipart:true,
			data:{
				file:restler.data(id,'application/octet-stream',fileContent)
			}
		}).on('complete',function(body){
			var err;
			try{
				JSON.parse(body);
				err = null;
			}catch(e){
				err = new Error('同步失败：\n'+body);
			}
			callback(err);
			console.log(body);
		});
	}
};

exports.deleteNote = function(provider,id,callback){
	var restler = require('restler');
	var querystring = require('querystring');
	var url = require('url');
	var config = window.config;
	if(provider === 'vdisk'){
		var accessToken = config.oauth.vdisk.accessToken;
		restler.post('https://api.weipan.cn/2/fileops/delete?'+querystring.stringify({
			access_token:accessToken
		}),{
			data:{
				root:'sandbox',
				path:id
			}
		}).on('complete',function(body){
			var err;
			try{
				JSON.parse(body);
				err = null;
			}catch(e){
				err = new Error('同步失败：\n'+body);
			}
			callback(err);
			console.log(body);
		});
	}
};

function asyncThread(threadCount,stack,func){
	if(!threadCount) threadCount = 1; //异步线程数
	if(!Array.isArray(stack)) stack = []; //需要处理的队列
	if(typeof func !== 'function') func = function(data,callback){callback();};	//对数据执行操作的函数
	var eventUtil = {};
	eventUtil.subList = {};
	eventUtil.on = function(e,callback){
		if(!eventUtil.subList[e]){
			eventUtil.subList[e] = [];
		}
		eventUtil.subList[e].push(callback);
	};
	eventUtil.trigger = function(e,data){
		if(eventUtil.subList[e] && eventUtil.subList[e].length){
			eventUtil.subList[e].forEach(function(callback){
				callback(e,data);
			});
		}
	};
	eventUtil.on('empty',function(threadIndex){
		if(!stack.length) return;
		var target = stack.shift();
		
		setTimeout(function(){
			func(target,function(){
				eventUtil.trigger('empty',threadIndex);
			});
		},0);
	});
	for(var i=threadCount;i--;){
		eventUtil.trigger('empty',i);
	}
}

