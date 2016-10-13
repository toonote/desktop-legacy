<style scoped>
.sidebar{
	-webkit-user-select: none;
	user-select:none;
	background:#F6F6F6;
	border-right:1px solid #E0E0E0;
	color:#585858;
	font-family: "PingFang SC";
	min-height:100%;
	width:250px;
}
.wrapper{
	line-height: 24px;
	padding-top: 10px;
}
.wrapper h2{
	font-size:12px;
	padding-left:15px;
	font-weight: normal;
}
.wrapper ul{
	list-style: none;
}
.wrapper li{
	font-size:13px;
	padding-left:25px;
	cursor:default;
}
.wrapper li.active{
	background: #CECECE;
}
.wrapper li.note::before{
	padding-right:3px;
	background-image:url(../images/icon-file.png);
}
.wrapper li.folder::before{
	padding-right:3px;
	background-image:url(../images/icon-folder.png);
}
</style>

<template>
<section class="sidebar">
	<section class="wrapper" v-for="notebook in notebooksWithCategories">
		<h2>{{notebook.title}}</h2>
		<ul>
			<li
				class="icon folder"
				v-for="(notes,category) in notebook.categories"
			>{{category}}
				<ul>
					<li
						class="icon note"
						v-bind:class="{active:(currentNote && note.id === currentNote.id) || note.id === contextMenuNoteId}"
						v-for="note in notes"
						v-on:click="switchCurrentNote(note.id)"
						v-on:contextmenu="showContextMenu(note.id)"
					>{{note.title}}</li>
				</ul>
			</li>
		</ul>
	</section>
</section>
</template>


<script>
import {mapGetters} from 'vuex';
import Menu from '../api/menu/index';
import util from '../modules/util';

let menu = new Menu(util.platform);
export default {
	computed: {
		...mapGetters(['notebooks', 'currentNote', 'contextMenuNoteId', 'notebooksWithCategories'])
	},
	methods: {
		isActive(noteId){
			let ret = false;
			// 当前笔记
			if(this.currentNote && noteId === this.currentNote.id){
				ret = true;
			}
			// 当前右键笔记
			if(this.contextMenuNoteId === noteId){
				ret = true;
			}
			return ret;
		},
		switchCurrentNote(noteId){
			this.$store.dispatch('switchCurrentNoteById', noteId);
			// eventHub.$emit('currentNoteChange', noteId);
		},
		showContextMenu(noteId){
			console.log('contextmenu');
			this.$store.commit('switchContextMenuNote', noteId);
			// this.$nextTick(() => {
			setTimeout(() => {
				menu.showContextMenu([{
					title:'打开',
					event:'noteOpen'
				},{
					title:'删除',
					event:'noteDelete'
				}]);
				setTimeout(()=>{
					this.$store.commit('switchContextMenuNote', 0);
				},30);
			},30);
		},
		/*hideContextMenu(){
			// 会自动关闭，这里主要是将当前右键笔记置空
			this.$store.commit('switchContextMenuNote', 0);
		}*/
	},
	data(){
		var data = {};
		return data;
	}
};
</script>
