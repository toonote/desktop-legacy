class Menu{
	constructor(){
		console.log('Menu init.');
	}
	on(eventType,callback){
		console.log('menu on');
		if(!this._eventList){
			this._eventList = {};
		}
		if(!this._eventList[eventType]){
			this._eventList[eventType] = [];
		}
		this._eventList[eventType].push(callback);
	}
	off(eventType,callback){
		if(!this._eventList || !this._eventList[eventType]) return;
		if(!callback){
			this._eventList[eventType] = [];
		}else{
			let index = this._eventList[eventType].indexOf(callback);
			if(index === -1) return;
			this._eventList[eventType].splice(index,1);
		}
	}
	trigger(eventType,data){
		console.log('menu trigger',this._eventList,this);
		if(!this._eventList || !this._eventList[eventType]) return;
		this._eventList[eventType].forEach((callback) => {
			callback(eventType,data);
		});
	}
	onClick(command){
		this.trigger('click', command);
	}
	buildMenu(menuList){

	}
}

export default Menu;
