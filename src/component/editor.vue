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
	<div
		id="ace_container"
		v-on:dragover.prevent="onDragOver"
		v-on:drop.prevent.stop="onDrop"
		v-on:paste="onPaste"
	></div>
</section>
</template>


<script>
import throttle from 'lodash.throttle';
import ace from 'brace';
import 'brace/theme/tomorrow';
import 'brace/mode/markdown';
import {mapGetters} from 'vuex';
import shortcut from '../modules/shortcut';
import io from '../modules/io';
let _aceEditor;
let _id,_content;
export default {
	computed:{
		...mapGetters(['currentNote'])
	},
	methods:{
		onDragOver(){
			// console.log('dragover');
		},
		onDrop(e){
			let img = e.dataTransfer.files[0];
			if(!img || !/^image/.test(img.type)) return;
			let ext = io.getExt(img.name);
			let imagePath = io.saveImage(img.path, ext);
			this.insertImg(imagePath);
		},
		onPaste(e){
			if(!e.clipboardData.items || !e.clipboardData.items.length) return;
			let hasImage = false;
			for(let i = e.clipboardData.items.length;i--;){
				let item = e.clipboardData.items[i];
				if(/^image/.test(item.type)){
					hasImage = true;
				}
			}
			if(!hasImage) return;

			let imagePath = io.saveImageFromClipboard();

			this.insertImg(imagePath);
		},
		insertImg(imagePath){

			if(imagePath){
				imagePath = encodeURI(imagePath);
				_aceEditor.insert(`\n\n![${name}](${imagePath})\n\n`);
			}else{
				_aceEditor.insert(`拖拽插入图片出错！`);
			}
			this.onEditorInput();
		},
		onEditorInput(){
			_content = _aceEditor.getValue();
			this.$store.dispatch('changeCurrentNoteContent', _content);
			// eventHub.$emit('currentNoteContentChange', content);
		}
	},
	watch:{
		currentNote(note){
			if(!note || (!note.content && note.content !== '')) return
			if(_content !== note.content){
				_aceEditor.setValue(note.content, -1);
			}
			if(_id !== note.id){
				_content = '';
				_id = note.id;
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
		aceEditor.renderer.setPadding(20);
		aceEditor.setShowPrintMargin(false);
		aceEditor.$blockScrolling = Infinity;
		aceEditor.on('input', this.onEditorInput);

		shortcut(aceEditor);
		/*for(let cmd in shortcut){
			aceEditor.commands.bindKey(cmd, shortcut[cmd]);
		}*/

		// 同步滚动
		session.on('changeScrollTop', throttle((scroll) => {
			let targetRow = aceEditor.getFirstVisibleRow();
			this.$store.dispatch('syncScroll', targetRow);
		}, 500));
		// if(timing && Date.now() - waitStart < 100) clearTimeout(timing);
		// timing = setTimeout(function(){
			// console.log(targetRow,scrollMap[targetRow]);
			/*animatedScroll($preview, scrollMap[targetRow], 500);
			waitStart = Date.now();
			timing = 0;*/
			// },100);
			// console.log('scroll',scroll);

		// 重新计算大小
		setTimeout(function(){
			aceEditor.resize();
		},0);
	}
};
</script>
