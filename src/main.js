import Vue from 'vue';
// import Vuex from 'vuex';

import Sidebar from './component/Sidebar.vue';
import Editor from 'tn-md-editor';
// import preview from './component/preview.vue';
// import menubar from './component/menubar.vue';
// import versions from './component/versions.vue';
import NotebookSelect from './component/NotebookSelect.vue';

// 生成store
// import getStore from './vuex/store';

// import io from './modules/io.js';

// 使用Vuex
// Vue.use(Vuex);

// store
// let store = getStore();

let app = new Vue({
	el: '#wrapper',
	// store,
	computed:{
		/* content(){
			console.log(this.$store.getters.currentNote);
			if(!this.$store.getters.currentNote){
				return '';
			}else{
				return this.$store.getters.currentNote.content;
			}
		},
		editAction(){
			return this.$store.getters.editAction;
		},
		layout(){
			this._tnEvent('layout');
			return this.$store.getters.layout;
		} */
	},
	methods:{
		_tnEvent: function(type, data){
			if(!data) data = {};
			this.tnEvent = {...data, type, _:Math.random()};
			this.$nextTick(() => {
				this.tnEvent = {};
			});
		},
		// 编辑器粘贴或者拖拽图片
		saveImage: function(filepath, ext){
			if(filepath === '@clipboard'){
				this._tnEvent('imageUrl', {url:io.saveImageFromClipboard()});
			}else{
				this._tnEvent('imageUrl', {url:io.saveImage(filepath, ext)});
			}
		},
		// 编辑器内容改变
		contentChange: function(content){
			this.$store.dispatch('changeCurrentNoteContent', content);
		},
		// 编辑器滚动
		lineScroll: function(row){
			this.$store.dispatch('syncScroll', row);
		}
	},
	data:{
		withMenubar:false,
		tnEvent: {}
	},
	components: {
		// menubar,
		Sidebar,
		Editor,
		// preview,
		// versions,
		NotebookSelect
	},
	watch: {
		editAction(){
			this._tnEvent('editAction', {
				action: this.$store.getters.editAction
			});
			console.log('tnEvent editActions: %s', this.$store.getters.editAction);
		}
	}
});

// 初始化
// store.dispatch('init');

export default app;
