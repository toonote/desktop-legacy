import path from 'path';

class Store{
	constructor(){
		console.log('Store init.');
	}
	_normalizePath(filePath){
		return path.normalize(path.join('./',filePath));
	}
}

export default Store;
