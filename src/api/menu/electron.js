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
		let buildMenu = (menuItem)=>{
			let subMenu;

			if(menuItem.subMenu){
				subMenu = menuItem.subMenu.map((menuItem) => {
					return buildMenu(menuItem);
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
				accelerator: menuItem.hotKey,
				click: menuItem.event?
					((event) => {
						console.log('[menu electron] bind click', event);
						return (item, focusWindow) => {
							console.log('[menu electron] click', event);
							this.trigger('click', event)
						}
					})(menuItem.event):undefined,
				submenu:subMenu
			};
			return thisMenu;
		};
		let template = menuList.map((menuItem) => {
			return buildMenu(menuItem);
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
