module.exports = {
	entry: ['babel-regenerator-runtime','./main.js'],
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
		}]
	},
    devtool: '#source-map'
};
