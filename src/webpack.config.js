module.exports = {
	entry: ['babel-regenerator-runtime','./main.js'],
	output: {
		path: __dirname,
		filename: 'main.js'
	},
	module: {
		// `loaders` is an array of loaders to use.
		// here we are only configuring vue-loader
		loaders: [{
			test: /\.vue$/, // a regex for matching all files that end in `.vue`
			loader: 'vue'   // loader to use for matched files
		},{
			test: /\.png$/,
			loader: 'url?limit=100000'
		},{
			test: /\.jsx?$/,
			exclude: /(node_modules|bower_components)/,
			loader: 'babel',
			query: {
				presets: ['es2015','stage-0']
			}
		}]
	},
    devtool: '#source-map'
};
