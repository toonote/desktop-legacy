import Web from './web';
import Macgap from './macgap';

class Menu{
	constructor(platform){
		this._platform = platform;
		if(platform === 'web'){
			return new Web();
		}else if(platform === 'macgap'){
			return new Macgap();
		}
	}
}

export default Menu;
