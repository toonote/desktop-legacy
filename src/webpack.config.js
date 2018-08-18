var webpack = require('webpack');
var path = require('path');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var VueLoaderPlugin = require('vue-loader').VueLoaderPlugin;
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

const config = {
	mode: 'production',
	entry: ['./main.js'],
	target: 'electron-renderer',
	node: false,
	output: {
		path: __dirname,
		filename: 'bundle.js'
	},
	module: {
		rules: [{
			test: /\.vue$/,
			use:{
				loader: 'vue-loader',
				options: {
					extractCSS: true
				}
			},
		},{
			test: /\.png$/,
			use:{
				loader: 'url-loader?limit=100000'
			}
		},{
			test: /\.js$/,
			exclude: /node_modules/,
			use:{
				loader: 'babel-loader'
			}
		},{
			test: /\.css$/,
            // exclude: /\-module\.css$/,
            // loader: ExtractTextPlugin.extract('style-loader','css-loader?root=' + path.normalize(__dirname + '/htdocs').replace(/\\/g,'/'))
            // loader: ExtractTextPlugin.extract('style-loader','css-loader')
			// use: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
			use: [
				MiniCssExtractPlugin.loader,
				'css-loader'
			]
		}]
	},
	plugins: [
		new VueLoaderPlugin(),
		new MiniCssExtractPlugin({
			filename: 'style/bundle.css'
		}),
		// new ExtractTextPlugin('style/bundle.css'),
		new webpack.DefinePlugin({
			DEBUG: process.env.NODE_ENV !== 'production' &&
			process.env.NODE_ENV !== 'test',
			TEST: process.env.NODE_ENV === 'test'
		}),
		// 有bug，先屏蔽
		// new webpack.optimize.ModuleConcatenationPlugin()
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
	devtool: process.env.NODE_ENV === 'production' ? '' : '#source-map',
};

if(process.env.NODE_ENV !== 'production'){
	config.mode = 'development';
	config.output.publicPath = 'http://localhost:8081/';
	config.plugins.push(new webpack.HotModuleReplacementPlugin());
	config.devServer = {
		port: 8081,
		hot: process.env.NODE_ENV !== 'production',
		inline: process.env.NODE_ENV !== 'production'
	};
}

module.exports = config;
