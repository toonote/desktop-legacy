var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
// 将npm中的模块在webpack打包时变成require(moduleName)
// 而不是将代码打包进去
var npmModules = Object.keys(require('./package.json').dependencies);
npmModules = npmModules.concat([
	'brace'
]);

var externals = {};
npmModules.forEach(function(npmModule){
	if(npmModule === 'vue'){
		var file = 'vue.js';
		if(process.env.NODE_ENV === 'production'){
			file = 'vue.min.js';
		}
		externals[npmModule] = 'commonjs ' + npmModule + '/dist/' + file;
		return;
	}
	externals[npmModule] = 'commonjs ' + npmModule;
});

module.exports = {
	entry: ['./main.js'],
	target: 'electron',
	output: {
		path: __dirname,
		filename: 'bundle.js'
	},
	module: {
		rules: [{
			test: /\.vue$/,
			use:{
				loader: 'vue-loader'
			}
		},{
			test: /\.png$/,
			use:{
				loader: 'url-loader?limit=100000'
			}
		},{
			test: /\.js$/,
			exclude: /node_modules/,
			use:{
				loader: 'babel-loader',
				options: {
					// presets: ['es2015','stage-0'],
					// plugins: ['transform-runtime']
				}
			}
		},{
			test: /\.css$/,
            // exclude: /\-module\.css$/,
            // loader: ExtractTextPlugin.extract('style-loader','css-loader?root=' + path.normalize(__dirname + '/htdocs').replace(/\\/g,'/'))
            // loader: ExtractTextPlugin.extract('style-loader','css-loader')
			use: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
		}]
	},
	plugins: [
		new ExtractTextPlugin('style/bundle.css'),
		new webpack.DefinePlugin({
			DEBUG: process.env.NODE_ENV !== 'production',
			CLOUD: !!process.env.CLOUD
		}),
		new webpack.optimize.ModuleConcatenationPlugin()
	],
	externals: [
		externals,
		function(context, request, callback){
			if(/ace\//.test(request)){
				return callback(null, 'commonjs2 ' + request);
			}
			if(/npm_modules\//.test(request)){
				return callback(null, 'commonjs2 ./' + path.relative('..', request));
			}
			callback();
		}
	],
	devtool: process.env.NODE_ENV === 'production' ? '' : '#source-map'
};
