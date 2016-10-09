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
console.log(util.platform);
export default util;
