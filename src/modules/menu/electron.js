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
	_getMenu(menuList, data = {}){
		// 标记是否已经添加过退出菜单
		let exitMenuPosition = '';
		let buildMenu = (menuItem)=>{
			let subMenu;

			if(menuItem.subMenu){
				subMenu = menuItem.subMenu.map((menuItem) => {
					return buildMenu(menuItem);
				});
			}
			if(menuItem.title === 'TooNote' || menuItem.title === 'Help'){
				subMenu.unshift({
					label: '关于TooNote',
					role: 'about',
					click: exitMenuPosition === 'File' ? (item, focusWindow) => {
						this.trigger('click', 'about');
					} : undefined
				});
				if(DEBUG){
					subMenu = subMenu.concat([{
						label:'Reload',
						accelerator:'cmd+r',
						click: (item, focusWindow) => {
							this.trigger('click', 'devReload');
						}
					},{
						label:'清理数据',
						click: (item, focusWindow) => {
							this.trigger('click', 'clearData');
						}
					}]);
				}
				// Mac，退出放到App菜单下
				if(menuItem.title === 'TooNote'){
					subMenu = subMenu.concat([{
						label: '退出',
						accelerator:'cmd+q',
						role: 'quit',
					}]);
					exitMenuPosition = menuItem.title;
				}
			}else if(menuItem.title === 'File'){
				if(!exitMenuPosition){
					subMenu = subMenu.concat([{
						type: 'separator'
					},{
						label: '退出',
						accelerator:'cmd+q',
						role: 'quit',
					}]);
					exitMenuPosition = menuItem.title;
				}
			}else if(menuItem.title === 'Edit'){
				subMenu = [{
					label: '撤销',
					accelerator: 'cmd+z',
					click: (item, focusWindow) => {
						this.trigger('click', 'undo');
					}
				},{
					label: '重做',
					accelerator: 'cmd+y',
					click: (item, focusWindow) => {
						this.trigger('click', 'redo');
					}
				},{
					type: 'separator'
				},{
					label: '剪切',
					role: 'cut'
				},{
					label: '复制',
					role: 'copy'
				},{
					label: '粘贴',
					role: 'paste'
				},{
					label: '删除',
					role: 'delete'
				},{
					label: '全选',
					role: 'selectall'
				}].concat(subMenu);
			}
			let thisMenu = {
				type:menuItem.type,
				label:menuItem.title,
				accelerator: menuItem.hotKey,
				click: menuItem.event ?
					((event) => {
						// console.log('[menu electron] bind click', event);
						return (item, focusWindow) => {
							// console.log('[menu electron] click', event);
							this.trigger('click', {
								event,
								data
							});
						};
					})(menuItem.event) : undefined,
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
	showContextMenu(menuList, data){
		let contextMenu = this._getMenu(menuList, data);
		contextMenu.popup(remote.getCurrentWindow());
	}
	get isVue(){
		return true;
	}
}

export default ElectronMenu;
