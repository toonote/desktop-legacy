<style scoped>
.sidebar{
	-webkit-user-select: none;
	user-select:none;
	background:#F6F6F6;
	border-right:1px solid #E0E0E0;
	color:#585858;
	/*font-family: "PingFang SC";*/
	min-height:100%;
	width:250px;
	overflow-y: auto;
}
h2 .operate{
	float: right;
	color:#585858;
	text-decoration: none;
	opacity: 0;
	transition: opacity .4s;
	padding-right: 10px;
}
h2:hover .operate{
	opacity: 1;
}
.wrapper{
	line-height: 24px;
	padding-top: 10px;
}
.wrapper h2,
.wrapper .notFound{
	font-size:12px;
	padding-left:15px;
	font-weight: normal;
}
.wrapper ul{
	list-style: none;
}
.wrapper li{
	font-size:13px;
	text-indent: 25px;
	/*padding-left:25px;*/
	cursor:default;
	white-space: nowrap;
	overflow: hidden;
}
.wrapper li li{
	text-indent: 44px;
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
.wrapper .note-list-move {
	transition: transform .4s;
}

.searchWrapper input{
	display: block;
    border: 0 none;
    width: 100%;
    height: 28px;
    border-bottom: 1px solid #e0e0e0;
    background: transparent;
    padding: 0 10px;
}
.searchWrapper input:focus{
	background: white;
	outline: 0 none;
}
</style>

<template>
<section class="sidebar">
	<user></user>
	<section class="searchWrapper">
		<input type="search" v-model.trim="searchKeyword" placeholder="搜索..." />
	</section>
	<section class="wrapper" v-show="!searchKeyword">
		<h2>{{currentNotebook.data.title}} <a class="operate" href="#" @click.prevent="exitNotebook">切换</a></h2>
		<ul>
			<li
				class="icon folder"
				v-for="category in currentNotebook.data.categories"
				:key="category.id"
				@click="switchFold(category.id)"
			>{{category.title}}
				<transition-group
					name="note-list"
					tag="ul"
					droppable="true"
					v-show="!isFold(category.id)"
					v-on:drop="drop"
					>
					<li
						draggable="true"
						class="icon note"
						v-for="note in category.notes"
						:key="note.id"
						:class="{active:isActive(note.id)}"
						@click.stop="switchCurrentNote(note.id)"
						@contextmenu.stop="showContextMenu(note.id)"
						@dragstart="dragStart($event, note.id)"
						@dragover.prevent="dragOver($event, note.id)"
					>{{note.title}}</li>
				</transition-group>
			</li>
		</ul>
	</section>
	<section class="wrapper" v-show="searchKeyword">
		<div class="notFound" v-show="!searchNoteList.data.length">搜的什么鬼 一篇都没有</div>
		<h2 v-show="searchNoteList.data.length">{{currentNotebook.data.title}}</h2>
		<ul v-show="searchNoteList.data.length">
			<li
				class="icon note"
				:class="{active:isActive(note.id)}"
				:key="note.id"
				v-for="note in searchNoteList.data"
				@click.stop="switchCurrentNote(note.id)"
				@contextmenu.stop="showContextMenu(note.id)"
			>{{note.title}} （{{note.category.title}}）</li>
		</ul>
	</section>
</section>
</template>


<script>
import debug from '../modules/util/debug';
import {uiData, switchCurrentNote, exitNotebook, search} from '../modules/controller';
import User from './User.vue';
import Menu from '../modules/menu/electron';
import stat from '../modules/util/stat';
import {throttle} from 'lodash';
// import env from '../modules/util/env';
const logger = debug('sidebar');

const menu = new Menu();

let _doExchange;

export default {
	computed: {
	},
	watch: {
		searchKeyword(){
			if(this.searchKeyword){
				stat.ga('send', 'event', 'note', 'searchStarted');
				search(this.searchKeyword);
			}
		}
	},
	methods: {
		isActive(noteId){
			let ret = false;
			// 当前笔记
			if(this.currentNote.data && noteId === this.currentNote.data.id){
				ret = true;
			}
			// 当前右键笔记
			if(this.currentContextMenuNoteId === noteId){
				ret = true;
			}
			return ret;
		},
		isFold(categoryId){
			return this.foldMap[categoryId];
		},
		switchFold(categoryId){
			this.foldMap = {
				...this.foldMap,
				[categoryId]: !this.foldMap[categoryId]
			};
		},
		switchCurrentNote(noteId){
			if(noteId === this.currentNote.data.id) return;
			stat.ga('send', 'event', 'note', 'switchCurrentNote', 'click');
			console.log('switchCurrentNote');
			switchCurrentNote(noteId);
			// this.$store.dispatch('switchCurrentNoteById', noteId);
			// eventHub.$emit('currentNoteChange', noteId);
		},
		exitNotebook(){
			exitNotebook();
		},
		showContextMenu(noteId){
			// console.log('contextmenu');
			stat.ga('send', 'event', 'note', 'showContextMenu');
			this.currentContextMenuNoteId = noteId;
			setTimeout(() => {
				menu.showContextMenu([{
					title:'打开',
					event:'noteOpen'
				},{
					title:'删除',
					event:'noteDelete'
				},{
					title:'新建',
					event:'newNote'
				},{
					type:'separator'
				},{
					title:'历史版本',
					event:'noteHistory'
				}], {
					targetType: 'note',
					targetId: noteId,
					from: 'sidebar',
				});
				setTimeout(()=>{
					this.currentContextMenuNoteId = '';
				},30);
			},30);
		},
		dragStart(e, noteId){
			// this.currentMovingNoteId = noteId;
		},
		dragOver(e, noteId){
			return;
			if(this.isAnimating) return;
			if(this.currentMovingNoteId === noteId) return;

			this.currentTargetingNoteId = noteId;

			if(!_doExchange){
				_doExchange = throttle(() => {
					this.isAnimating = true;
					this.$store.dispatch('exchangeNote', {
						id1:this.currentMovingNoteId,
						id2:this.currentTargetingNoteId
					});
					setTimeout(() => {
						this.isAnimating = false;
					}, 500);
				}, 500);
			}
			_doExchange();
			stat.ga('send', 'event', 'note', 'sort');
		},
		drop(e){
			return;
			this.currentMovingNoteId = 0;
			// console.log('drop', e);
		}
		/*hideContextMenu(){
			// 会自动关闭，这里主要是将当前右键笔记置空
			this.$store.commit('switchContextMenuNote', 0);
		}*/
	},
	data(){
		return {
			currentNotebook: uiData.currentNotebook,
			currentNote: uiData.currentNote,
			searchKeyword: '',
			searchNoteList: uiData.searchNoteList,
			currentContextMenuNoteId: '',
			foldMap: {}
		};
	},
	components:{
		User
	}
};
</script>
