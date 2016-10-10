<style scoped>
.editor{
	border-right:1px solid #E0E0E0;
	font-family: "PingFang SC";
	height:100%;
	flex:1;
}
#ace_container{
	height:100%;
	font-size: 14px;
    line-height: 28px;
}
</style>

<template>
<section class="editor">
	<div id="ace_container"></div>
</section>
</template>


<script>
import ace from 'brace';
import 'brace/theme/tomorrow';
import 'brace/mode/markdown';
import {mapGetters} from 'vuex'
let _aceEditor;
let _content;
export default {
	computed:{
		...mapGetters(['currentNote'])
	},
	watch:{
		currentNote(note){
			if(!note || !note.content) return
			if(_content !== note.content){
				_aceEditor.setValue(this.currentNote.content, -1);
			}

		}
	},
	data(){
		var data = {
			// content:''
		};
		return data;
	},
	mounted(){
		var aceEditor = ace.edit('ace_container');
		var session = aceEditor.getSession();
		_aceEditor = aceEditor;
		aceEditor.setTheme('ace/theme/tomorrow');
		session.setMode('ace/mode/markdown');
		session.setUseWrapMode(true);
		aceEditor.renderer.setHScrollBarAlwaysVisible(false);
		aceEditor.renderer.setShowGutter(false);
		aceEditor.renderer.setPadding(10);
		aceEditor.setShowPrintMargin(false);
		aceEditor.$blockScrolling = Infinity;
		aceEditor.on('input', () => {
			_content = aceEditor.getValue();
			this.$store.commit('changeCurrentNoteContent', _content);
			// eventHub.$emit('currentNoteContentChange', content);
		});

		// 重新计算大小
		setTimeout(function(){
			aceEditor.resize();
		},0);
	}
};
</script>
