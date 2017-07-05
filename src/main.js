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
		layout(){
			this._tnEvent('layout');
			return this.$store.getters.layout;
		}
	},
	methods:{
		_tnEvent: function(type, data){
			if(!data) data = {};
			this.tnEvent = {...data, type, _:Math.random()};
			this.$nextTick(() => {
				this.tnEvent = {};
			});
		},
		saveImage: function(filepath, ext){
			if(filepath === '@clipboard'){
				this._tnEvent('imageUrl', {url:io.saveImageFromClipboard()});
			}else{
				this._tnEvent('imageUrl', {url:io.saveImage(filepath, ext)});
			}
			console.log(this.imageUrl);
		}
	},
	data:{
		withMenubar:false,
		tnEvent: {}
	},
	components: {
		menubar,
		sidebar,
		editor,
		preview,
		versions
	},
	/*watch: {
		layout(){
			this._tnEvent('layout');
		}
	}*/
});

// 初始化
store.dispatch('init');

export default app;
