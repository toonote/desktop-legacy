import debug from './modules/util/debug';

import Vue from 'vue';

import Sidebar from './component/Sidebar.vue';
import Editor from 'tn-md-editor';
import Preview from './component/Preview.vue';
// import versions from './component/versions.vue';
import NotebookSelect from './component/NotebookSelect.vue';

import {uiData, updateCurrentNote} from './modules/controller';
import * as menu from './modules/menu';

const logger = debug('main');

menu.init();

// import io from './modules/io.js';

let app = new Vue({
	el: '#wrapper',
	computed:{
		content(){
			return this.currentNoteContent.data || '';
		},
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
		contentChange: function(data){
			updateCurrentNote({
				content:data.content
			}, data.isEditingHeading);
		},
		// 编辑器滚动
		lineScroll: function(row){
			this.$refs.preview.scrollToSourceLine(row);
		}
	},
	data(){
		return {
			currentNote: uiData.currentNote,
			currentNoteContent: uiData.currentNoteContent,
			layout: uiData.layout,
			tnEvent: {}
		};
	},
	components: {
		Sidebar,
		Editor,
		Preview,
		// versions,
		NotebookSelect
	},
	watch: {
		/* editAction(){
			this._tnEvent('editAction', {
				action: this.$store.getters.editAction
			});
			logger('tnEvent editActions: %s', this.$store.getters.editAction);
		}, */
		layout: {
			handler(){
				this._tnEvent('layout');
				logger('tnEvent layout');
			},
			deep: true
		}
	}
});

export default app;
