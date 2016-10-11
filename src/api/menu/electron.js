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
	_getMenu(menuList){
		let template = menuList.map((menuItem) => {
			let subMenu;
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
		let menu = remote.Menu.buildFromTemplate(template);
		return menu;
	}
	buildMenu(menuList){
		let menu = this._getMenu(menuList);
		remote.Menu.setApplicationMenu(menu);
	}
	showContextMenu(menuList){
		let contextMenu = this._getMenu(menuList);
		contextMenu.popup(remote.getCurrentWindow());
	}
	get isVue(){
		return true;
	}
}

export default ElectronMenu;
