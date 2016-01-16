let util = {};

util.platform = 'web';
if(window.MacGap){
	util.platform = 'macgap';
}else if(typeof global !== 'undefined'){
	util.platform = 'electron';
}

export default util;
