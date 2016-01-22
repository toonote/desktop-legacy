import Menu from './base';

class WebMenu extends Menu{
	constructor(){
		console.log('web menu init');
		super();
		if(WebMenu._instance){
			console.log('cache');
			return WebMenu._instance;
		}
		console.log('no cache');
		WebMenu._instance = this;
	}
	buildMenu(menuList){

	}

	get isVue(){
		return true;
	}
}

export default WebMenu;
