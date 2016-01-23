import Menu from './base';

class MacgapMenu extends Menu{
	constructor(){
		console.log('macgap menu init');
		super();
		if(MacgapMenu._instance){
			console.log('cache');
			return MacgapMenu._instance;
		}
		console.log('no cache');
		MacgapMenu._instance = this;
	}
	buildMenu(menuList){
		menuList.forEach((menu) => {
			var macgapMenu = MacGap.Menu.getItem(menu.title);
			if(!macgapMenu){
				MacGap.Menu.addItem({
					label:menu.title
				});
				macgapMenu = MacGap.Menu.getItem(menu.title);
			}
			if(menu.title === 'TooNote'){
				menu.subMenu.push({
					title:'Reload',
					event:'devReload',
					hotKey:'cmd+r'
				});
			}
			menu.subMenu.forEach((menu) => {
				var macgapSubMenu = macgapMenu.submenu.getItem(menu.title);
				if(!macgapSubMenu){
					macgapMenu.submenu.addItem({label:menu.title,keys:menu.hotKey});
					macgapSubMenu = macgapMenu.submenu.getItem(menu.title);
				}

				macgapSubMenu.callback = ()=>{
					this.trigger('click',menu.event);
				};
				// macgapSubMenu.enabled = true;
			});
		});

	}

	get isVue(){
		return false;
	}
}

export default MacgapMenu;
