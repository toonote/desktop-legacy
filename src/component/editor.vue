<style scoped>
.editor{
	border-right:1px solid #E0E0E0;
	font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
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
import {throttle} from 'lodash';
import ace from 'brace';
import 'brace/theme/tomorrow';
import 'brace/mode/markdown';
import {mapGetters} from 'vuex';
import shortcut from '../modules/shortcut';
import io from '../modules/io';
import logger from '../modules/logger';
import util from '../modules/util';
let _aceEditor;
let _id,_content;
export default {
	computed:{
		...mapGetters(['currentNote', 'layout', 'editAction'])
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
			logger.ga('send', 'event', 'editor', 'insertImg', 'drag');
		},
		onPaste(e){
			if(!e.clipboardData.items || !e.clipboardData.items.length) return;
			// 判断是否有图片
			let hasImage = false;
			for(let i = e.clipboardData.items.length;i--;){
				let item = e.clipboardData.items[i];
				if(/^image/.test(item.type)){
					hasImage = true;
				}
			}

			// 判断是否是表格
			// 例如从numbers复制出来的会同时有image/png和text
			let isTable = true;
			let text = e.clipboardData.getData('text/plain');
			// 如果没有\n，认为不是表格
		    if(!/\n/.test(text)){
		    	isTable = false;
		    }
			let rows = text.split('\n').filter(row => row);
		    // 如果有不含\t的，认为不是表格
		    if(rows.some(row => !/\t/.test(row))){
		        isTable = false;
		    }

			// 插入图片
			if(hasImage && !isTable){
				let imagePath = io.saveImageFromClipboard();

				this.insertImg(imagePath);
				logger.ga('send', 'event', 'editor', 'insertImg', 'paste');
			}else if(isTable){
				this.insertTable(rows);
			}

		},
		insertImg(imagePath){

			if(imagePath){
				imagePath = encodeURI(imagePath);
				if(util.os === 'windows'){
					// 把\替换回来
					imagePath = imagePath.replace(/%5C/g,'\\');
				}
				_aceEditor.insert(`\n\n![${name}](${imagePath})\n\n`);
			}else{
				_aceEditor.insert(`插入图片出错！`);
			}
			this.onEditorInput();
		},
		insertTable(rows){

			let getTextWidth = (str) => {
				let ret = str.length;
				for(let i=str.length; i--; ){
					if(str[i].charCodeAt(0) > 127){
						ret++;
					}
				}
				return ret;
			};

			let paddingRight = (str, char, length) => {
				for(var i=length-getTextWidth(str);i--;){
					str += char;
				}
				return str;
			};

			// 确定每一列的长度
			let colWidth = [];

			let rowArray = rows.map((row) => {
				let cols = row.split('\t');
				for(let i=0;i<cols.length;i++){
					let thisColWidth = getTextWidth(cols[i]);
					if(!colWidth[i]) colWidth[i] = 0;

					if(thisColWidth > colWidth[i]){
						colWidth[i] = thisColWidth;
					}
				}
				return cols;
			});

			// 添加一个表头下面的行（第2行）
			rowArray.splice(1, 0, colWidth.map((width)=>paddingRight('', '-', width)));

			let ret = rowArray.map((row) => {
				let ret = '|';

				ret += row.map((col, index) => {
					let thisColWidth = colWidth[index];
					return paddingRight(col, ' ', thisColWidth) + '|';
				}).join('');

				return ret;
			}).join('\n');

			let undo = _aceEditor.getSession().getUndoManager();

			setTimeout(()=>{
				undo.undo();
				_aceEditor.insert(`${ret}`);
			});

		},
		onEditorInput(){
			logger.debug('onEditorInput');
			_content = _aceEditor.getValue();
			this.$store.dispatch('changeCurrentNoteContent', _content);
		},
		resize(){
			_aceEditor.resize();
			// 动画完之后再resize一次
			setTimeout(()=>{
				_aceEditor.resize();
			},500);
		}
	},
	watch:{
		currentNote(note){
			if(!note.id) return;
			if(_id !== note.id){
				_content = '';
				_id = note.id;
			}
		},
		'currentNote.content': function(content){
			// console.log('watch currentNote.content change');
			if(!content && content !== '') return
			if(_content !== content){
				_aceEditor.setValue(content, -1);
				// 清除undo列表
				setTimeout(() => {
					_aceEditor.getSession().getUndoManager().reset();
					// console.log(_aceEditor.getSession().getUndoManager().hasUndo());
				},0);
			}
		},
		'layout.preview': function(){
			this.resize();
		},
		'layout.sidebar': function(){
			this.resize();
		},
		'layout.editor': function(){
			this.resize();
		},
		'editAction': function(){
			if(!this.editAction) return;
			let undo = _aceEditor.getSession().getUndoManager();
			if(this.editAction === 'undo') {
				if(undo.hasUndo()){
					undo.undo(true);
				}
			}else if(this.editAction === 'redo') {
				if(undo.hasRedo()){
					undo.redo(true);
				}
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
		if(util.os === 'windows'){
			// 设置字体后会导致宽度变大，挺奇怪的
			// aceEditor.setOption('fontFamily', '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif');
		}
		aceEditor.on('input', this.onEditorInput);

		shortcut(aceEditor);
		/*for(let cmd in shortcut){
			aceEditor.commands.bindKey(cmd, shortcut[cmd]);
		}*/

		// 同步滚动
		session.on('changeScrollTop', throttle((scroll) => {
			let targetRow = aceEditor.getFirstVisibleRow();
			this.$store.dispatch('syncScroll', targetRow);
			logger.ga('send', 'event', 'editor', 'scroll');
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
		setTimeout(() => {
			this.resize();
		},0);

		window.addEventListener('resize', throttle(this.resize, 50));


	}
};
</script>
