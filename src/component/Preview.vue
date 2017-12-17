<style scoped>
.preview{
	font-family: "PingFang SC";
	height:100%;
	overflow-y:auto;
	flex:1;
	font-size:14px;
	line-height: 28px;
	background:#fff;
}
@import "../style/htmlbody.css";
</style>

<template>
<section class="preview">
	<div
		tabindex="0"
		class="htmlBody"
		v-html="html"
		@keydown.space="previewAttachmentByKeyboard"
		@click="handleContentOrAttachment"
		@contextmenu="showContextMenu"
		@dblclick="openAttachment"
	></div>
</section>
</template>


<script>
// import 'highlight.js/styles/github-gist.css';
import debug from '../modules/util/debug';
import 'highlight.js/styles/tomorrow.css';
import * as mdRender from '../modules/util/mdRender';
import io from '../modules/util/io';
import eventHub from '../modules/util/eventHub';
import Menu from '../modules/menu/electron';
import {uiData} from '../modules/controller';
import scroll from '../modules/scroll';

const logger = debug('preview');
const menu = new Menu();

// 滚动时源码和渲染后位置的对应表
let scrollMap = [];

export default {
	computed:{
	},
	methods: {
		renderHtml() {
			console.time('renderHtml');
			const html = mdRender.basicRender(this.currentNoteContent.data)
			console.timeEnd('renderHtml');
			return html;
		},
		handleContentOrAttachment(e) {
			let $target = e.target;
			// 链接
			if($target.tagName === 'A' && /^https?:\/\//.test($target.href)){
				logger('click on link');
				let shell = require('electron').shell;
				shell.openExternal($target.href);
				e.preventDefault();
				this.currentContextAttachment = {};
			}else if($target.closest('.tn-attachment')){
				logger('click on attachment');
				let $attachment = $target.closest('.tn-attachment');
				this.currentContextAttachment = {
					id: $attachment.dataset.id,
					src: $attachment.dataset.src,
					title: $attachment.dataset.title,
				};
			}else{
				this.currentContextAttachment = {};
			}
		},
		// 附件上右键
		showContextMenu(e) {
			const $attachment = e.target.closest('.tn-attachment');
			if(!$attachment) return;
			menu.showContextMenu([{
					title:'打开',
					event:'attachmentOpen'
				},{
					title:'预览',
					event:'attachmentPreview'
				},{
					title:'在Finder中查看',
					event:'attachmentOpenInFinder'
				},{
					title:'另存为',
					event:'attachmentSave'
				}], {
					targetType: 'attachment',
					targetId: $attachment.dataset.id,
					targetSrc: $attachment.dataset.src,
					targetTitle: $attachment.dataset.title,
					from: 'preview',
				});
		},
		openAttachment(src){
			if(typeof src === 'object'){
				const $attachment = src.target.closest('.tn-attachment');
				if(!$attachment) return;
				src = $attachment.dataset.src;
			}
			require('electron').shell.openExternal(src);
		},
		previewAttachmentByKeyboard(e){
			logger('previewAttachmentByKeyboard');
			if(!this.currentContextAttachment.id) return;
			this.previewAttachment({
				targetId: this.currentContextAttachment.id,
				targetSrc: this.currentContextAttachment.src,
				targetTitle: this.currentContextAttachment.title
			});
			e.preventDefault();
		},
		previewAttachment(data){
			logger('previewAttachment');
			const src = data.targetSrc.replace(/^file:\/\//,'');
			require('electron').remote.getCurrentWindow().previewFile(src, data.title);
		},
		// 将预览区滚动到和源码位置一样
		scrollToSourceLine(row) {
			if(!scrollMap || !scrollMap.length){
				this.buildScrollMap();
			}
			let targetPosition = scrollMap[row];
			if(typeof targetPosition === 'undefined') return;
			scroll.doScroll(this.$el, targetPosition, 500);
		},
		// 构建滚动对应的信息表
		buildScrollMap(){
			if(!this.layout.data.preview) return;
			console.time('buildScrollMap');
			let $preview = this.$el;
			let $previewAnchors = $preview.querySelectorAll('.line');
			Array.prototype.forEach.call($previewAnchors, function($previewAnchor){
				let line = $previewAnchor.dataset.line;
				let top = $previewAnchor.offsetTop;
				if(top && (top > scrollMap[line] || typeof scrollMap[line] === 'undefined')){
					scrollMap[line] = top;
				}
			});
			scrollMap[0] = 0;

			let contentLines = this.currentNoteContent.data.split('\n').length;
			if(!scrollMap[contentLines - 1]) scrollMap[contentLines - 1] = $preview.scrollHeight;

			for(var i = 1; i<contentLines -1; i++){
				if(!scrollMap[i]){
					var j = i+1;
					while(!scrollMap[j] && j < contentLines - 1){
						j++;
					}
					scrollMap[i] = scrollMap[i-1] + (scrollMap[j] - scrollMap[i-1]) / (j-i+1);
				}
			}
			console.timeEnd('buildScrollMap');
		}
	},
	watch:{
		currentNoteContent: {
			handler(){
				if(!this.currentNoteContent.data){
					this.html = '';
					return;
				}
				// 如果预览区没显示，则不渲染
				if(!this.layout.data.preview){
					return;
				}
				this.html = this.renderHtml();
			},
			deep: true
		},
		layout: {
			handler(){
				if(this.layout.data.preview){
					this.html = this.renderHtml();
				}
			},
			deep: true
		},
		html(){
			this.$nextTick(() => {
				scrollMap = [];
			});
		}
	},
	data(){
		var data = {
			currentNoteContent: uiData.currentNoteContent,
			currentContextAttachment: {},
			layout: uiData.layout,
			html: ''
		};
		return data;
	},
	mounted(){
		eventHub.on('attachmentOpen', (data) => {
			this.openAttachment(data.targetSrc);
		});
		eventHub.on('attachmentPreview', (data) => {
			this.previewAttachment(data);
		});
		eventHub.on('attachmentOpenInFinder', (data) => {
			const src = data.targetSrc.replace(/^file:\/\//,'');
			require('electron').shell.showItemInFolder(src);
		});
		eventHub.on('attachmentSave', (data) => {
			const src = data.targetSrc.replace(/^file:\/\//,'');
			io.saveAs(src, data.targetTitle);
		});
		// console.log('[preview] mounted', this, this.$store);

	}
};
</script>
