var ExtractTextPlugin = require('extract-text-webpack-plugin');

let npmModules = Object.keys(require('./package.json').dependencies);
let externals = {};
npmModules.forEach((npmModule) => {
	if(npmModule === 'vue'){
		externals[npmModule] = `commonjs ${npmModule}/dist/vue.js`;
		return;
	}
	externals[npmModule] = `commonjs ${npmModule}`;
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
			loader: 'vue'
		},{
			test: /\.png$/,
			loader: 'url?limit=100000'
		},{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel',
			query: {
				// presets: ['es2015','stage-0'],
				// plugins: ['transform-runtime']
			}
		},{
            test: /\.css$/,
            // exclude: /\-module\.css$/,
            // loader: ExtractTextPlugin.extract('style-loader','css-loader?root=' + path.normalize(__dirname + '/htdocs').replace(/\\/g,'/'))
            // loader: ExtractTextPlugin.extract('style-loader','css-loader')
            loader: ExtractTextPlugin.extract({ fallbackLoader: 'style-loader', loader: 'css-loader' })
		}]
	},
	plugins: [
        new ExtractTextPlugin('style/bundle.css')
    ],
	externals: externals,
    devtool: process.env.NODE_ENV === 'production'?'':'#source-map'
};
