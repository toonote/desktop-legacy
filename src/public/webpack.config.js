module.exports = {
	entry: './main.js',
	output: {
		path: __dirname,
		filename: 'bundle.js'
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
			loader: 'babel?presets=es2015', // 'babel-loader' is also a legal name to reference
		}]
	},
    devtool: '#source-map'
};
