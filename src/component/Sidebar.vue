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
	transition: padding-top .4s ease-in-out, padding-bottom .4s ease-in-out;
}
.wrapper li.active{
	background: #CECECE;
}
.wrapper li.movingUp{
	padding-top: 24px;
}
.wrapper li.movingDown{
	padding-bottom: 24px;
}
.wrapper li.note::before{
	padding-right:3px;
	background-image:url(../images/icon-file.png);
}
.wrapper li.folder::before{
	padding-right:3px;
	background-image:url(../images/icon-folder.png);
}
.wrapper li.folder-open::before{
	padding-right:3px;
	background-image:url(../images/icon-folder-open.png);
}
.wrapper li .categoryInput{
	width: calc(100% - 70px);
}
/* .wrapper .note-list-move {
	transition: transform .4s;
} */

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
	<task></task>
	<user></user>
	<section class="searchWrapper">
		<input type="search" v-model.trim="searchKeyword" placeholder="搜索..." />
	</section>
	<section class="wrapper" v-show="!searchKeyword">
		<h2>{{currentNotebook.data.title}} <a class="operate" href="#" @click.prevent="exitNotebook">切换</a></h2>
		<ul>
			<li
				class="icon folder"
				draggable="true"
				v-for="category in currentNotebook.data.categories"
				:key="category.id"
				:class="{active:isActive(category.id), 'folder-open':!isFold(category.id)}"
				@dragstart.stop="dragStart($event, 'category', category)"
				@dragover.stop="dragStart($event, 'category', category)"
				@contextmenu.stop="showCategoryContextMenu(category.id)"
				@click="switchFold(category.id)"
			>
				<span v-show="currentEditCategoryId!==category.id">{{category.title}}</span>
				<input
					class="titleInput categoryInput"
					v-focus-input
					v-show="currentEditCategoryId===category.id"
					:value="category.title"
					@keydown.enter="categoryRename(category.id, $event.target.value)"
					@keydown.esc="currentEditCategoryId=''"
					@click.stop
				/>
				<transition-group
					name="note-list"
					tag="ul"
					v-show="!isFold(category.id)"
					@drop.native.prevent="drop"
					>
					<li
						draggable="true"
						class="icon note"
						v-for="note in category.notes"
						:key="note.id"
						:class="{active:isActive(note.id), movingUp:movingOverClass(note, 'up'), movingDown:movingOverClass(note, 'down')}"
						@click.stop="switchCurrentNote(note.id)"
						@contextmenu.stop="showNoteContextMenu(note.id)"
						@dragstart.stop="dragStart($event, 'note', note)"
						@dragover.stop.prevent="dragOver($event, 'note', note)"
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
				@contextmenu.stop="showNoteContextMenu(note.id)"
			>{{note.title}} （{{note.category.title}}）</li>
		</ul>
	</section>
</section>
</template>


<script>
import debug from '../modules/util/debug';
import {
	uiData,
	switchCurrentNote,
	updateNoteOrder,
	updateNoteCategory,
	updateCategoryOrder,
	exitNotebook,
	categoryRename,
	search
} from '../modules/controller';
import User from './User.vue';
import Task from './Task.vue';
import Menu from '../modules/menu/electron';
import stat from '../modules/util/stat';
import eventHub from '../modules/util/eventHub';
import {throttle} from 'lodash';
// import env from '../modules/util/env';
const logger = debug('sidebar');

const menu = new Menu();

let movingOverDirection;

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
		isActive(noteOrCategoryId){
			let ret = false;
			// 当前笔记
			if(this.currentNote.data && noteOrCategoryId === this.currentNote.data.id){
				ret = true;
			}
			// 当前右键笔记
			if(this.currentContextMenuNoteId === noteOrCategoryId){
				ret = true;
			}
			// 当前右键笔记
			if(this.currentContextMenuCategoryId === noteOrCategoryId){
				ret = true;
			}
			return ret;
		},
		isFold(categoryId){
			return this.foldMap[categoryId];
		},
		movingOverClass(note, direction){
			if(this.currentMovingNote){
				if(!this.currentMovingOverNote) return false;
				if(this.currentMovingOverNote.id !== note.id) return false;
				if(this.currentMovingNote.id === note.id) return false;
				// 必须是同一个分类
				if(this.currentMovingNote.category.id !== note.category.id){
					movingOverDirection = 'down';
					return movingOverDirection === direction;
				}

				let movingDirection = '';
				if(note.order < this.currentMovingNote.order){
					// 在上方
					// logger('在上方');
					movingDirection = 'up';
				}else{
					// 在下方
					// logger('在下方');
					movingDirection = 'down';
				}
				movingOverDirection = movingDirection;
				return movingDirection === direction;
			}else if(this.currentMovingCategory){
				let category = note.category;
				if(!this.currentMovingOverCategory) return false;
				if(this.currentMovingOverCategory.id !== category.id) return false;
				if(this.currentMovingCategory.id === category.id) return false;

				let movingDirection = '';
				if(category.order < this.currentMovingCategory.order){
					// 在上方
					// logger('在上方');
					movingDirection = 'up';
				}else{
					// 在下方
					// logger('在下方');
					movingDirection = 'down';
				}
				movingOverDirection = movingDirection;
				return false;
			}
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
		categoryRename(categoryId, newTitle){
			if(!newTitle) return;
			this.currentEditCategoryId = '';
			categoryRename(categoryId, newTitle);
		},
		showCategoryContextMenu(categoryId){
			// console.log('contextmenu');
			stat.ga('send', 'event', 'note', 'showCategoryContextMenu');
			this.currentContextMenuCategoryId = categoryId;
			setTimeout(() => {
				menu.showContextMenu([{
					title:'重命名',
					event:'categoryRename'
				},{
					title:'删除',
					event:'categoryDelete'
				},{
					title:'新建',
					event:'categoryCreate'
				}], {
					targetType: 'category',
					targetId: categoryId,
					from: 'sidebar',
				});
				setTimeout(()=>{
					this.currentContextMenuCategoryId = '';
				},30);
			},30);
		},
		showNoteContextMenu(noteId){
			// console.log('contextmenu');
			stat.ga('send', 'event', 'note', 'showNoteContextMenu');
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
		dragStart(e, type, noteOrCategory){
			if(this.currentMovingNote || this.currentMovingCategory) return;
			if(type === 'note'){
				this.currentMovingNote = noteOrCategory;
			}else{
				logger('currentMovingCategory', noteOrCategory.id);
				this.currentMovingCategory = noteOrCategory;
			}
			e.dataTransfer.effectAllowed = 'move';
			logger('onDragStart', type, noteOrCategory.id);
		},
		dragOver(e, type, noteOrCategory){
			if(this.currentMovingNote){
				this.currentMovingOverNote = noteOrCategory;
			}else if(this.currentMovingCategory){
				if(type === 'note'){
					logger('dragOver', noteOrCategory.category.id);
					this.currentMovingOverCategory = noteOrCategory.category;
				}else if(type === 'category'){
					logger('dragOver', noteOrCategory.id);
					this.currentMovingOverCategory = noteOrCategory;
				}
			}
		},
		drop(e){
			logger('onDrop');
			if(this.currentMovingNote){
				if(this.currentMovingOverNote.id !== this.currentMovingNote.id){
					// 需要更新分类
					if(this.currentMovingNote.category.id !== this.currentMovingOverNote.category.id){
						updateNoteCategory(this.currentMovingNote.id, this.currentMovingOverNote.category.id);
					}
					// 更新顺序
					updateNoteOrder(this.currentMovingNote.id, this.currentMovingOverNote.id, movingOverDirection);
				}
			}else if(this.currentMovingCategory){
				logger('todo:分类排序', movingOverDirection);
				// 需要更新顺序
				if(this.currentMovingOverCategory.id !== this.currentMovingCategory.id){
					updateCategoryOrder(this.currentMovingCategory.id, this.currentMovingOverCategory.id, movingOverDirection);
				}
			}
			this.currentMovingNote = null;
			this.currentMovingOverNote = null;
			this.currentMovingCategory = null;
			this.currentMovingOverCategory = null;

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
			currentContextMenuCategoryId: '',
			currentEditCategoryId: '',
			currentMovingNote: null,
			currentMovingOverNote: null,
			currentMovingCategory: null,
			currentMovingOverCategory: null,
			foldMap: {}
		};
	},
	components:{
		User,
		Task
	},
	mounted(){
		eventHub.on('categoryRename', (categoryId) => {
			this.currentEditCategoryId = categoryId;
			logger('categoryRename', categoryId);
		});
	}
};
</script>
