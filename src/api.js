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
				/*var requestCode = parsedUrl.query.code;
				authWindow.close();
				request({
					method:'POST',
					url:'https://auth.sina.com.cn/oauth2/access_token',
					form:{
						client_id:clientId,
						client_secret:clientSecret,
						grant_type:'authorization_code',
						code:requestCode,
						redirect_uri:redirectUrl
					}
				},function(err,response,body){
					console.log(err,response,body);
				});*/
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

exports.doSync = function(provider){
	var request = require('request');
	var querystring = require('querystring');
	var url = require('url');
	var config = window.config;
	if(provider === 'vdisk'){
		var accessToken = config.oauth.vdisk.accessToken;
		request('https://api.weipan.cn/2/metadata/sandbox/?'+querystring.stringify({
			access_token:accessToken
		}),{
			strictSSL:false
		},function(err,response,body){
			console.log(err,response,body);
			if(err) return;
			var fileList = JSON.parse(body).contents;
			console.log(fileList);
		});
	}
};