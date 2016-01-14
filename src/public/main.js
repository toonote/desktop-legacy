var Vue = require('vue');
var Sidebar = require('./component/sidebar.vue');
var Editor = require('./component/editor.vue');
var Preview = require('./component/preview.vue');

var app = new Vue({
	el: 'body',
	data:{
		content:'hello world'
	},
	events: {
		sourceChange: (content) => {
			app.$broadcast('sourceChange',content);
		}
	},
	components: {
		sidebar: Sidebar,
		editor: Editor,
		preview: Preview
	}
});


