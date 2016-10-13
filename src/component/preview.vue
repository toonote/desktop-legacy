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
	<div class="htmlBody" v-html="html"></div>
</section>
</template>


<script>
import {mapGetters} from 'vuex'
let _render;
export default {
	computed:{
		html(){
			if(!this.currentNote || !this.currentNote.content){
				return ''
			}
			return _render.render(this.currentNote.content)
		},
		/*currentNote(){
			return this.$store.getters.currentNote
		},*/
		...mapGetters(['currentNote'])
	},
	watch:{
		html(){
			this.$nextTick(() => {
				let scrollMap = [];

				let $preview = this.$el;
				let $previewAnchors = $preview.querySelectorAll('.line');
				Array.prototype.forEach.call($previewAnchors, function($previewAnchor){
					let top = $previewAnchor.offsetTop;
					if(top && top > scrollMap[$previewAnchor.dataset.line]){
						scrollMap[$previewAnchor.dataset.line] = top;
					}
				})

				let contentLines = this.currentNote.content.split('\n').length;
				if(!scrollMap[0]) scrollMap[0] = 0;
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

				this.$store.commit('changeScrollMap', scrollMap);
				// console.log(scrollMap);
				// console.log('html changed');
			});
		}
	},
	data(){
		var data = {
			// content:'',
			// html:''
		};
		return data;
	},
	mounted(){
		console.log('[preview] mounted', this, this.$store);
		var Remarkable = require('remarkable');
		var previewRenderer = new Remarkable();
		var index = 0;

		let customerRulesMap = {
			paragraph: 'p',
			table: 'table',
			// list_item: 'li',
			// tr: 'tr',
		};

		for(let token in customerRulesMap){
			console.log('[preview]',token);
			let tag = customerRulesMap[token];
			previewRenderer.renderer.rules[`${token}_open`] = function (tokens, idx) {
				var line;
				if(tag === 'tr'){
					console.log(tokens[idx]);
				}
				if (tokens[idx].lines/* && tokens[idx].level === 0*/) {
					line = tokens[idx].lines[0];
					return `<${tag} class="line" data-line="${line}">`;
				}
				return `<${tag}>`;
			};
		}

		previewRenderer.renderer.rules.heading_open = function (tokens, idx) {
			var line;
			if (tokens[idx].lines && tokens[idx].level === 0) {
				line = tokens[idx].lines[0];
				return '<h' + tokens[idx].hLevel + ' class="line" data-line="' + line + '"><a name="anchor'+(index++)+'">';
			}
			return '<h' + tokens[idx].hLevel + '>';
		};

		previewRenderer.renderer.rules.heading_close = function (tokens, idx) {
			return '</a></h'+ tokens[idx].hLevel + '>';
		};
		_render = previewRenderer;
	}
};
</script>
