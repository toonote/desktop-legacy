export default {
	ga(){
		if(typeof DEBUG !== 'undefined' && !DEBUG){
			window.ga.apply(window, arguments);
		}
	}
};
