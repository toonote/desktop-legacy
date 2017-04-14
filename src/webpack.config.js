var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

// 将npm中的模块在webpack打包时变成require(moduleName)
// 而不是将代码打包进去
var npmModules = Object.keys(require('./package.json').dependencies);
var externals = {};
npmModules.forEach(function(npmModule){
	if(npmModule === 'vue'){
		externals[npmModule] = 'commonjs ' + npmModule + '/dist/vue.js';
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
		loaders: [{
			test: /\.vue$/,
			loader: 'vue-loader'
		},{
			test: /\.png$/,
			loader: 'url-loader?limit=100000'
		},{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader',
			query: {
				// presets: ['es2015','stage-0'],
				// plugins: ['transform-runtime']
			}
		},{
			test: /\.css$/,
            // exclude: /\-module\.css$/,
            // loader: ExtractTextPlugin.extract('style-loader','css-loader?root=' + path.normalize(__dirname + '/htdocs').replace(/\\/g,'/'))
            // loader: ExtractTextPlugin.extract('style-loader','css-loader')
			loader: ExtractTextPlugin.extract({ fallback: 'style-loader', loader: 'css-loader' })
		}]
	},
	plugins: [
		new ExtractTextPlugin('style/bundle.css'),
		new webpack.DefinePlugin({
			DEBUG: process.env.NODE_ENV !== 'production',
			CLOUD: !!process.env.CLOUD
		})
	],
	externals: externals,
	devtool: process.env.NODE_ENV === 'production' ? '' : '#source-map'
};
