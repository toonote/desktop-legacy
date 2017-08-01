import path from 'path';
import fs from 'fs';
import logger from './logger';
import util from './util';

export default class Git{

	constructor(options){
		if(!options) options = {};
		// git二进制程序路径
		this._git = path.join(require('electron').remote.app.getAppPath(), `lib/${util.os}/git`);

		// git仓库根目录
		let gitFolder = 'git';
		if(DEBUG) gitFolder = 'devgit';
		if(TEST) gitFolder = 'testgit';
		this._root = options.path || path.join(require('electron').remote.app.getPath('userData'), gitFolder);

		// 新建仓库根目录
		if(!fs.existsSync(this._root)){
			fs.mkdirSync(this._root);
		}
	}
	// 获取git根目录
	getPath(){
		return this._root;
	}
	runCommand(command){
		let execSync = require('child_process').execSync;
		try{
			logger.debug('[Git runCommand] ' + command);
			return execSync(`${this._git} ${command}`, {
				cwd: this._root
			}).toString();
		}catch(e){
			logger.error('[Git runCommand Error]', e);
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
	log(folderPath){
		let log = this.runCommand(`log --pretty=format:"%H %ct" ${folderPath}`);
		if(!log){
			return [];
		}
		let logArray = log.trim().split('\n').map((line) => {
			let linePart = line.split(' ');
			return {
				id: linePart[0],
				date: new Date(linePart[1] * 1000)
			};
		}).filter((logItem) => {
			return logItem.date.getTime() >= Date.now() - 30 * 24 * 3600 * 1000;
		});
		return logArray;
	}
	commit(msg){
		this.runCommand('add .');
		return this.runCommand(`commit -am "${msg}"`);
	}
	show(version, filePath){
		return this.runCommand(`show ${version}:${filePath}`);
	}
}

