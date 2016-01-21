import Menu from './base';

class WebMenu extends Menu{
	constructor(){
		super();
		console.log('WebMenu init.');
	}
	buildMenu(menuList){

	}
	get isVue(){
		return true;
	}
}

export default WebMenu;
