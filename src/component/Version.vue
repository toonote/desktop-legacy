<style scoped>
.versions{
	position: absolute;
	z-index: 2;
	width: 800px;
	height: 450px;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	background:white;
	border:5px solid #bbb;
	color:#585858;
	display: flex;
}
.wrapper{
	-webkit-user-select: none;
	user-select: none;
	width: 300px;
	background:#F6F6F6;
	border-right:1px solid #E0E0E0;
	line-height: 24px;
	padding: 10px 0;
	overflow: auto;
	height: calc(100% - 20px);
}
.wrapper ul{
	list-style: none;
}
.wrapper li{
	font-size:13px;
	text-indent: 15px;
	/*padding-left:25px;*/
	cursor:default;
	overflow: hidden;
    white-space: nowrap;
}
.wrapper li li{
	text-indent: 34px;
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
.content{
	display: flex;
	flex:1;
	padding:10px;
	overflow: auto;
}
.closeBtn{
	position: absolute;
	right:-15px;
	top:-15px;
	width:20px;
	height: 20px;
	line-height: 20px;
	text-align: center;
	font-size:14px;
    background: white;
    border: 5px solid rgba(128,128,128,.6);
    border-radius: 15px;
    cursor:pointer;
	transition: transform .8s;
}
.closeBtn:hover{
	transform: rotateZ(720deg);
}
</style>

<template>
<section tabindex="1" class="mask" v-on:keydown.esc="hideVersions" v-on:click="hideVersions" v-show="versions.data.list.length">
<section class="versions" v-on:click.stop="()=>{}">
	<div class="closeBtn" v-on:click="hideVersions">✖︎</div>
	<section class="wrapper">
		<ul>
			<li
				class="icon folder"
			>{{note.title}}
				<ul>
					<li
						class="icon note"
						:class="{active:isActive(version.id)}"
						v-for="version in versions.data.list"
						:key="version.id"
						@click="switchCurrentVersion(version.id)"
						@contextmenu="showContextMenu(version.id)"
					>[{{formatDate(version.createdAt)}}]{{version.message}}</li>
				</ul>
			</li>
		</ul>
	</section>
	<section class="content"><pre>{{versions.data.currentContent}}</pre></section>
</section>
</section>
</template>


<script>
import Menu from '../modules/menu/electron';
import debug from '../modules/util/debug';
import eventHub from '../modules/util/eventHub';
import {uiData, showVersions, hideVersions, showVersionContent, updateNote} from  '../modules/controller';

const logger = debug('version');
const menu = new Menu();

export default {
	computed: {
		/* ...mapGetters([
			'versions',
			'contextMenuVersionId'
		]) */
	},
	watch: {
		// 出现历史版本对话框的时候聚焦
		// 以便响应ESC按键
		/* 'versions.currentNote': function(){
			// console.log('versions.currentNote changed', this.versions.currentNote.id, this.$el);
			if(this.versions.currentNote){
				this.$nextTick(() => {
					this.$el.focus();
				});
			}
		} */
	},
	methods: {
		formatDate(date){
			let ts = date.getTime() - date.getTimezoneOffset()*60*1000;
			let s = new Date(ts).toISOString();

			// s.replace(/T.+$/,'');	// 2015-11-24
			// s.replace(/\-\d+T.+$/,''); // 2015-11
			// s.replace(/(^\d+\-|T.+$)/g,''); // 11-24
			// s.replace(/(^[0-9\-]+T|\.\d+Z$)/g,''); // 14:16:18
			// s.replace(/(^[0-9\-]+T|:\d+\.\d+Z$)/g,''); // 14:16
			// s.replace(/T/g,' ').replace(/\.\d+Z$/,''); // 2015-11-24 14:16:18
			// s.replace(/T/g,' ').replace(/:\d+\.\d+Z$/,''); // 2015-11-24 14:16
			return s.replace(/T/g,' ').replace(/^\d+\-/, '').replace(/:\d+\.\d+Z$/,''); // 11-24 14:16

		},
		isActive(versionId){
			return versionId === this.activeVersionId ||
				versionId === this.contextMenuVersionId;
			// active:(versions.activeVersionId && versions.activeVersionId === version.id) || contextMenuVersionId == version.id}
		},
		switchCurrentVersion(versionId){
			this.activeVersionId = versionId;
			showVersionContent(versionId, this.note.id);
		},
		hideVersions(){
			hideVersions();
			this.note = {};
		},
		showContextMenu(versionId){
			// console.log('contextmenu');
			this.contextMenuVersionId = versionId;
			// this.$store.commit('switchContextMenuVersion', versionId);
			// this.$nextTick(() => {
			setTimeout(() => {
				menu.showContextMenu([{
					title:'打开',
					event:'versionOpen'
				},{
					title:'恢复该版本',
					event:'versionRestore'
				}], {
					targetType: 'version',
					targetId: versionId,
				});
				setTimeout(()=>{
					this.contextMenuVersionId = '';
					// this.$store.commit('switchContextMenuVersion', 0);
				},30);
			},30);
		}
	},
	data(){
		return {
			versions:uiData.versions,
			currentNotebook:uiData.currentNotebook,
			contextMenuVersionId: '',
			activeVersionId: '',
			note:{}
		};
	},
	mounted(){
		eventHub.on('noteHistory', (noteId) => {
			logger('show noteHistory');
			this.note = this.currentNotebook.data.notes.filter((note) => {
				return note.id === noteId;
			})[0];
			this.contextMenuVersionId = '';
			this.activeVersionId = '';
			showVersions(noteId);
			if(!this.versions.data.list.length){
				alert('暂无历史版本');
			}
			// this.versions.currentNote = {};
		});
		eventHub.on('versionOpen', (versionId) => {
			logger('versionOpen');
			this.switchCurrentVersion(versionId);
		});
		eventHub.on('versionRestore', (versionId) => {
			logger('versionRestore');
			this.switchCurrentVersion(versionId);
			updateNote({
				id: this.note.id,
				content: this.versions.data.currentContent
			});
			alert(`“${this.note.title}”版本恢复成功`);
		});
	}
};
</script>
