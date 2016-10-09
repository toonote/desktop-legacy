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
			console.log(this.currentNote);
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
	// props:['content'],
	/*created: function () {
		eventHub.$on('currentNoteContentChange', this.currentNoteContentChange);
		eventHub.$on('currentNoteDidChange', this.currentNoteDidChange);
	},
	beforeDestroy: function () {
		eventHub.$off('currentNoteContentChange', this.currentNoteContentChange);
		eventHub.$off('currentNoteDidChange', this.currentNoteDidChange);
	},*/
	/*methods:{
		currentNoteContentChange(content){
			this.source = content;
			let html = _render.render(content);
			this.html = html;
		},
		currentNoteDidChange(note){
			this.currentNoteContentChange(note.content);
		}
	},*/
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
		_render = previewRenderer;
	}
};
</script>
