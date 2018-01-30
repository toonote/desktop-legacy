const args = process.argv;
const action = args[2];
const fs = require('fs');
const path = require('path');
const buildScripts = {};

buildScripts['build-upgrade'] = function(){
	const schemaPath = './modules/storage/realm/schema';
	const schemaScript = fs.readdirSync(schemaPath)
		.filter((filename) => /\.js$/.test(filename)).map((filename) => {
			return fs.readFileSync(schemaPath + '/' + filename, 'utf-8')
				.replace('export default', 'exports.' + filename.replace(/\.js$/, '') + ' = ')
				.replace('// @ts-check', '');
		}).join('\n');
	fs.writeFileSync('./docs/upgrade/scripts/1.0.0.schema.js', schemaScript);
};

if(!action){
	console.error('No build action');
	process.exit(-1);
}
buildScripts[action]();
