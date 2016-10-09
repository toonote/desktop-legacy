import Web from './web';
import Macgap from './macgap';
import Electron from './electron';

class Menu{
	constructor(platform){
		this._platform = platform;
		if(platform === 'web'){
			return new Web();
		}else if(platform === 'macgap'){
			return new Macgap();
		}else if(platform === 'electron'){
			return new Electron();
		}
	}
}

export default Menu;
