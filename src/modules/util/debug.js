import debug from 'debug';

function init(){
	if(process.env.debug){
		localStorage.setItem('debug', process.env.debug);
	}else{
		localStorage.removeItem('debug');
	}
}

init();

export default function(module){
	return debug(module);
}
