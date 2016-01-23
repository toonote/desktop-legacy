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
@import "../htmlbody.css";
</style>

<template>
<section class="preview">
	<div class="htmlBody">{{{html}}}</div>
</section>
</template>


<script>
export default {
	// props:['content'],
	events:{
		currentNoteContentChange(content){
			this.source = content;
			let html = this._render.render(content);
			this.html = html;
		},
		currentNoteDidChange(note){
			this.$emit('CurrentNoteContentChange',note.content);
		}
	},
	data(){
		var data = {
			content:'',
			html:''
		};
		return data;
	},
	ready(){
		var Remarkable = require('remarkable');
		var previewRenderer = new Remarkable();
		var index = 0;
		previewRenderer.renderer.rules.paragraph_open = function (tokens, idx) {
			var line;
			if (tokens[idx].lines && tokens[idx].level === 0) {
				line = tokens[idx].lines[0];
				return '<p class="line" data-line="' + line + '">';
			}
			return '<p>';
		};

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
		this._render = previewRenderer;
	}
};
</script>
