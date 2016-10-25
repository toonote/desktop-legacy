import path from 'path';
import fs from 'fs';

export default class Git{

	constructor(options){
		this._git = path.join(require('electron').remote.app.getAppPath(), 'lib/git');
		this._root = options.path;
		if(!fs.existsSync(this._root)){
			fs.mkdirSync(this._root);
		}
	}
	runCommand(command){
		let execSync = require('child_process').execSync;
		try{
			console.log('[Git runCommand] ' + command);
			return execSync(`${this._git} ${command}`, {
				cwd: this._root
			}).toString();
		}catch(e){
			console.log('[Git runCommand Error]', e);
			return false;
		}
	}
	hasInited(){
		return fs.existsSync(path.join(this._root, '.git'));
	}
	init(){
		let ret = this.runCommand('init');
		ret += ';' + this.runCommand('config user.name "TooNote"');
		ret += ';' + this.runCommand('config user.email "toonote@local.git"');
		return ret;
	}
	status(){
		return this.runCommand('status');
	}
	checkout(commitOrPath){
		return this.runCommand(`checkout ${commitOrPath}`);
	}
	log(path){
		let log = this.runCommand(`log --pretty=format:"%H %ct" ${path}`);
		if(!log){
			return [];
		}
		let logArray = log.trim().split('\n').map((line) => {
			let linePart = line.split(' ');
			return {
				id: linePart[0],
				date: new Date(linePart[1]*1000)
			}
		});
		return logArray;
	}
	commit(msg){
		this.runCommand('add .');
		return this.runCommand(`commit -am "${msg}"`);
	}
	show(version, path){
		return this.runCommand(`show ${version}:${path}`)
	}
}

