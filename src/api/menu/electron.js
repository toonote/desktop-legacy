import Menu from './base';

class ElectronMenu extends Menu{
	constructor(){
		console.log('electron menu init');
		super();
		if(ElectronMenu._instance){
			console.log('cache');
			return ElectronMenu._instance;
		}
		console.log('no cache');
		ElectronMenu._instance = this;
	}


	get isVue(){
		return true;
	}
}

export default ElectronMenu;
