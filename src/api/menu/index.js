import Electron from './electron';

class Menu{
	constructor(platform){
		this._platform = platform;
		return new Electron();
	}
}

export default Menu;
