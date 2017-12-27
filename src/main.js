import debug from './modules/util/debug';

import Vue from 'vue';
import './directive/focusInput';

import Sidebar from './component/Sidebar.vue';
import Editor from 'tn-md-editor';
import Preview from './component/Preview.vue';
import Version from './component/Version.vue';
import NotebookSelect from './component/NotebookSelect.vue';

import {uiData, updateNote, createAttachment} from './modules/controller';
import * as menu from './modules/menu';
import eventHub from './modules/util/eventHub';

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
		saveAttachment: function(filepath, ext){
			let attachmentInfo = {};

			if(filepath === '@clipboard'){
				attachmentInfo = createAttachment({from: 'clipboard'});
			}else{
				attachmentInfo = createAttachment({
					from: 'file',
					path: filepath,
					ext
				});
			}
			if(attachmentInfo.id){
				this._tnEvent('newAttachment', {
					url: 'tnattach://' + attachmentInfo.id + attachmentInfo.ext,
					filename: attachmentInfo.filename
				});
			}
		},
		// 编辑器内容改变
		contentChange: function(data){
			updateNote({
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
		Version,
		NotebookSelect
	},
	watch: {
		layout: {
			handler(){
				this._tnEvent('layout');
				logger('tnEvent layout');
			},
			deep: true
		}
	},
	mounted(){
		eventHub.on('edit', (action) => {
			this._tnEvent('editAction', {
				action
			});
			logger('tnEvent editAction');
		});
	}
});

export default app;
