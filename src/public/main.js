import Vue from 'vue';
import Sidebar from './component/sidebar.vue';
import Editor from './component/editor.vue';
import Preview from './component/preview.vue';

let app = new Vue({
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


