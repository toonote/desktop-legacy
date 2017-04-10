export default {
	ga(){
		if(typeof DEBUG !== 'undefined' && !DEBUG){
			window.ga.apply(window, arguments);
		}
	},
	_log(level, arg){
		let styleMap = {
			debug: 'color:#999',
			error: 'color:#f60;background:#fcc'
		};
		let style = styleMap[level];
		if(DEBUG){
			let argv = Array.prototype.slice.call(arg);
			argv.unshift(`[${level}]`);
			/*let count = 0;
			for(let i=0; i<argv.length; i++){
				if(typeof argv[i] === 'string'){
					argv[i] = '%c' + argv[i];
					count++;
					// argv.splice(i+1, 0, style);
					// i++;
				}
			}
			for(let i=0; i<count; i++){
				argv.push(style);
			}*/
			console.log.apply(console, argv);
		}
	},
	debug(){
		this._log('debug', arguments);
	},
	error(){
		this._log('error', arguments);
	}
}
