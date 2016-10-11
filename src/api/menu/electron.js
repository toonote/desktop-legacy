import Menu from './base';
import {remote} from 'electron';

class ElectronMenu extends Menu{
	constructor(){
		// console.log('electron menu init');
		super();
		if(ElectronMenu._instance){
			// console.log('cache');
			return ElectronMenu._instance;
		}
		// console.log('no cache');
		ElectronMenu._instance = this;
	}
	buildMenu(menuList){
		let template = menuList.map((menuItem) => {
			let subMenu = [];
			if(menuItem.subMenu){
				subMenu = menuItem.subMenu.map((menuItem) => {
					return {
						label: menuItem.title,
						accelerator: menuItem.hotKey,
						click: ((event) => {
							return (item, focusWindow) => {
								this.trigger('click', event)
							}
						})(menuItem.event)
					}
				});
			}
			if(menuItem.title === 'TooNote'){
				subMenu.unshift({
					role: 'about'
				});
				subMenu.push({
					label:'Reload',
					accelerator:'cmd+r',
					click: (item, focusWindow) => {
						this.trigger('click', 'devReload');
					}
				});
			}
			let thisMenu = {
				label:menuItem.title,
				submenu:subMenu
			};
			return thisMenu;
		});
		console.log('[menu electron]',template);
		let menu = remote.Menu.buildFromTemplate(template);
		remote.Menu.setApplicationMenu(menu);
	}
	get isVue(){
		return true;
	}
}

export default ElectronMenu;
