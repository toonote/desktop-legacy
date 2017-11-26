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
	<div class="htmlBody" v-html="html" v-on:click="handleContent"></div>
</section>
</template>


<script>
// import 'highlight.js/styles/github-gist.css';
import 'highlight.js/styles/tomorrow.css';
import renderer from '../modules/renderer';
import {uiData} from '../modules/controller';

export default {
	computed:{
		html(){
			if(!this.currentNote.data || !this.currentNote.data.content){
				return ''
			}
			console.time('renderHTML');
			const html = renderer.render(this.currentNote.data.content)
			console.timeEnd('renderHTML');
			return html;
		},
	},
	methods: {
		handleContent(e) {
			let $target = e.target;
			// 链接
			if($target.tagName === 'A' && /^https?:\/\//.test($target.href)){
				let shell = require('electron').shell;
				shell.openExternal($target.href);
				e.preventDefault();
			}
		}
	},
	watch:{
		html(){
			this.$nextTick(() => {
				let scrollMap = [];

				let $preview = this.$el;
				let $previewAnchors = $preview.querySelectorAll('.line');
				Array.prototype.forEach.call($previewAnchors, function($previewAnchor){
					let line = $previewAnchor.dataset.line;
					let top = $previewAnchor.offsetTop;
					/*if(line == 8){
						console.log(line, top, $previewAnchor);
					}*/
					if(top && (top > scrollMap[line] || typeof scrollMap[line] === 'undefined')){
						scrollMap[line] = top;
					}
				});
				scrollMap[0] = 0;

				let contentLines = this.currentNote.data.content.split('\n').length;
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
				// console.log(scrollMap[8]);

				// this.$store.commit('changeScrollMap', scrollMap);
				// console.log(scrollMap);
				// console.log('html changed');
			});
		}
	},
	data(){
		var data = {
			currentNote: uiData.currentNote
			// content:'',
			// html:''
		};
		return data;
	},
	mounted(){
		// console.log('[preview] mounted', this, this.$store);

	}
};
</script>
