import Vue from 'vue';
import Vuex from 'vuex';

import sidebar from './component/sidebar.vue';
import editor from './component/editor.vue';
import preview from './component/preview.vue';
import menubar from './component/menubar.vue';
import versions from './component/versions.vue';

// 生成store
import getStore from './vuex/store';

// 使用Vuex
Vue.use(Vuex);

// store
let store = getStore();

let app = new Vue({
	el: '#wrapper',
	store,
	computed:{
		...Vuex.mapGetters(['layout'])
	},
	methods:{
	},
	data:{
		withMenubar:false
	},
	components: {
		menubar,
		sidebar,
		editor,
		preview,
		versions
	}
});

// 初始化
store.dispatch('init');

export default app;
