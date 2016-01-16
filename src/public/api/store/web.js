import Store from './base';

class WebStore extends Store{
	constructor(){
		super();
		console.log('WebStore init.');
	}
	createFolder(folderName){

	}
	getFileList(folderName){

	}
	_getPathKey(path){
		return 'TooNote-LocalStorage-Key-' + path;
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
	async readFile(fileName){
		return new Promise((resolve,reject) => {
			var path = this._normalizePath(fileName);
			var content = localStorage.getItem(this._getPathKey(path)) || false;
			resolve(content);
		});
	}
}

export default WebStore;
