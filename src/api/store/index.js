import path from 'path';

class Store{
	constructor(){
	}
	_normalizePath(filePath){
		return path.normalize(path.join('./',filePath));
	}
	_getPathKey(path){
		let Env = '';
		if(DEBUG){
			Env = 'Dev-';
		}
		return 'TooNote-LocalStorage-Key-' + Env + path;
	}
	async writeFile(fileName,fileContent){
		return new Promise((resolve,reject) => {
			var path = this._normalizePath(fileName);
			try{
				localStorage.setItem(this._getPathKey(path),fileContent);
				resolve();
			}catch(e){
				reject(e);
			}
		});
	}
	async deleteFile(fileName){
		return new Promise((resolve,reject) => {
			var path = this._normalizePath(fileName);
			try{
				localStorage.removeItem(this._getPathKey(path));
				resolve();
			}catch(e){
				reject(e);
			}
		});
	}
	async readFile(fileName){
		return new Promise((resolve,reject) => {
			var path = this._normalizePath(fileName);
			var content = localStorage.getItem(this._getPathKey(path));
			if(typeof content !== 'string') content = false;
			resolve(content);
		});
	}
}

export default Store;
