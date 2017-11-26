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
		<input type="search" v-model.trim="keyword" placeholder="搜索..." />
	</section>
	<section class="wrapper" v-show="!keyword">
		<h2>{{currentNotebook.data.title}}</h2>
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
	<!-- <section class="wrapper" v-show="isSearching">
		<div class="notFound" v-show="!searchResults.length">搜的什么鬼 一篇都没有</div>
		<ul v-show="searchResults.length">
			<li
				class="icon folder"
				v-for="(notes,category) in searchResultsWithCategories"
			>{{category}}
				<ul>
					<li
						class="icon note"
						v-bind:class="{active:isActive(note.id)}"
						v-for="note in notes"
						v-on:click="switchCurrentNote(note.id)"
						v-on:contextmenu="showContextMenu(note.id)"
					>{{note.title}}</li>
				</ul>
			</li>
		</ul>
	</section> -->
</section>
</template>


<script>
import {uiData, switchCurrentNote} from '../modules/controller';
import User from './User.vue';
import {throttle} from 'lodash';
// import Menu from '../api/menu/index';
import env from '../modules/util/env';
import logger from '../modules/logger';

// let menu = new Menu(util.platform);

let _doExchange;

export default {
	computed: {
		/* ...mapGetters([
			'notebooks',
			'currentNote',
			'contextMenuNoteId',
			'notebooksWithCategories',
			'isSearching',
			'searchResults',
			'searchResultsWithCategories'
		]) */
	},
	watch: {
		/* keyword(){
			if(this.keyword){
				logger.ga('send', 'event', 'note', 'searchStarted');
				this.$store.dispatch('search', this.keyword);
			}else{
				logger.ga('send', 'event', 'note', 'searchEnded');
				this.$store.commit('switchSearching', false);
			}
		} */
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
			logger.ga('send', 'event', 'note', 'switchCurrentNote', 'click');
			console.log('switchCurrentNote');
			switchCurrentNote(noteId);
			// this.$store.dispatch('switchCurrentNoteById', noteId);
			// eventHub.$emit('currentNoteChange', noteId);
		},
		showContextMenu(noteId){
			// console.log('contextmenu');
			logger.ga('send', 'event', 'note', 'showContextMenu');
			this.$store.commit('switchContextMenuNote', noteId);
			// this.$nextTick(() => {
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
				}]);
				setTimeout(()=>{
					this.$store.commit('switchContextMenuNote', 0);
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
			logger.ga('send', 'event', 'note', 'sort');
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
		/* var data = {
			currentMovingNoteId:0,
			currentTargetingNoteId:0,
			isAnimating:false,
			keyword:'',
			foldMap:{}
		};
		return data; */
		return {
			currentNotebook: uiData.currentNotebook,
			currentNote: uiData.currentNote,
			keyword: '',
			foldMap: {}
		};
	},
	components:{
		User
	}
};
</script>
