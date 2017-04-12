let util = {};

if(typeof MacGap !== 'undefined'){
	util.platform = 'macgap';
}else if(typeof process !== 'undefined'){
	// if(process.browser){
		util.platform = 'electron';
	// }else{
		// util.platform = 'electron';
	// }
}else{
	util.platform = 'web';
}

util.os = 'osx';
if(process.platform === 'win32'){
	util.os = 'windows';
}

export default util;
