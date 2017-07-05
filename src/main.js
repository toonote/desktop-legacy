import Vue from 'vue';
import Vuex from 'vuex';

import sidebar from './component/sidebar.vue';
import editor from 'tn-md-editor';
import preview from './component/preview.vue';
import menubar from './component/menubar.vue';
import versions from './component/versions.vue';

// 生成store
import getStore from './vuex/store';

import io from './modules/io.js';

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
		saveImage: function(filepath, ext){
			if(filepath === '@clipboard'){
				this.imageUrl = io.saveImageFromClipboard();
			}else{
				this.imageUrl = io.saveImage(filepath, ext);
			}
			console.log(this.imageUrl);
		}
	},
	data:{
		withMenubar:false,
		imageUrl: ''
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
