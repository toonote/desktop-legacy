var Vue = require('vue');
var Sidebar = require('./component/sidebar.vue');

new Vue({
	el: 'body',
	components: {
		// include the required component
		// in the options
		sidebar: Sidebar
	}
});
