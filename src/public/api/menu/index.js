import Web from './web';

class Menu{
	constructor(platform){
		this._platform = platform;
		return new Web();
	}
}

export default Menu;
