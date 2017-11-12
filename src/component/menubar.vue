<style scoped>
.menubar{
	font-family: "PingFang SC";
	height:24px;
	font-size:13px;
	line-height: 24px;
	background:linear-gradient(top,#EEE,#CCC);
	cursor: default;
}
.menubar.hidden{
	display: none;
}
.menubar ul{
	padding:0 20px;
	list-style: none;
}
.menubar ul li{
	display: inline-block;
	margin-right:10px;
}
.menubar ul li.active{
	background:rgb(40,141,248);
	color: white;
}
.menubar ul li span{
	padding:0 5px;
}
.menubar ul > li > ul{
	position: absolute;
	background:#D6D6D6;
	color:#333;
	opacity: .9;
	display: none;
	box-shadow:0 3px 3px rgba(192,192,192,.5);
	padding:0;
	border:1px solid #ccc;
}
.menubar ul > li.active > ul{
	display: block;
}
.menubar ul > li > ul > li{
	margin:0;
}
.menubar ul > li > ul > li:hover{
	color:white;
	background:rgb(40,141,248);
}
.menubar ul > li > ul > li > span{
	padding:0 20px;
}
</style>

<template>
<section class="menubar">
	<ul>
		<li v-for="menu in menuList" v-bind:class="{active:menu.isActive}" v-on:click="menuClick(menu.title)">
			<span>{{menu.title}}</span>
			<ul v-if="menu.subMenu && menu.subMenu.length">
				<li v-for="subMenu in menu.subMenu" v-on:click="subMenuClick(subMenu.event)"><span>{{subMenu.title}}</span></li>
			</ul>
		</li>
	</ul>
</section>
</template>


<script>
import Menu from '../api/menu/index';
import util from '../modules/util';
import logger from '../modules/logger';
import {getConfig} from '../modules/config';
// import app from '../component/app';
let menu = new Menu(util.platform);

export default {
	methods:{
		menuClick(title){
			this.menuList.forEach(function(menu){
				if(menu.title === title){
					menu.isActive = !menu.isActive;
				}else{
					menu.isActive = false;
				}
			});
			// 触发vue更新
			// this.menuList = this.menuList.concat([]);
		},
		subMenuClick(event){
			menu.onClick(event);
		},
		// 获取菜单列表
		getMenu(){
			let appMenu = {
				title:'TooNote',
				isActive:false,
				subMenu:[]
			};
			let fileMenu = {
				title:'File',
				isActive:false,
				subMenu:[{
					title:'新建笔记',
					event:'newNote',
					hotKey:'cmd+n'
				},{
					title:'保存',
					event:'saveNote',
					hotKey:'cmd+s'
				},{
					type: 'separator'
				},{
					title:'导出MarkDown',
					event:'exportMd',
				},{
					title:'导出HTML Body',
					event:'exportHtmlBody',
				},{
					title:'导出HTML Body（带样式）',
					event:'exportHtmlBodyWithCss',
				},{
					title:'导出完整HTML',
					event:'exportHtml',
				},{
					title:'导出PDF',
					event:'exportPdf',
				},{
					type: 'separator'
				},{
					title:'导入备份',
					event:'importBackup'
				}]
			};
			let editMenu = {
				title:'Edit',
				isActive:false,
				subMenu:[{
					title:'复制全文MD',
					event:'copyFullMd'
				},{
					title:'复制全文HTML',
					event:'copyFullHTML'
				},{
					title:'复制全文(微信)',
					event:'copyFullHTMLForWx'
				}]
			};
			let viewMenu = {
				title:'View',
				isActive:false,
				subMenu:[{
					title:'切换笔记列表',
					event:'switchLayoutSidebar',
					hotKey:'cmd+1'
				},{
					title:'切换编辑区',
					event:'switchLayoutEditor',
					hotKey:'cmd+2'
				},{
					title:'切换预览区',
					event:'switchLayoutPreview',
					hotKey:'cmd+3'
				}]
			};
			let helpMenu = {
				title:'Help',
				isActive:false,
				subMenu:[]
			};
			let menuList = [appMenu,fileMenu,editMenu,viewMenu];
			if(util.os === 'windows'){
				menuList = [fileMenu,editMenu,viewMenu,helpMenu];
			}
			return menuList;
		},
		/******************以下为菜单响应*****************/
		// 新建笔记
		newNote(){
			logger.ga('send', 'event', 'note', 'new');
			this.$store.dispatch('newNote');
		},
		// 切换当前笔记
		switchCurrentNote(note){
			logger.ga('send', 'event', 'note', 'switchCurrentNote', 'init');
			this.$store.commit('switchCurrentNote', note);
		},
		// 打开当前右键笔记
		openContextMenuNote(){
			logger.ga('send', 'event', 'note', 'switchCurrentNote', 'contextMenu');
			this.$store.dispatch('openContextMenuNote');
		},
		// 删除当前右键笔记
		deleteContextMenuNote(){
			logger.ga('send', 'event', 'note', 'delete', 'contextMenu');
			this.$store.dispatch('deleteContextMenuNote');
		},
		// 查看当前右键笔记历史版本
		historyContextMenuNote(){
			logger.ga('send', 'event', 'history', 'enter', 'contextMenu');
			this.$store.dispatch('historyContextMenuNote');
		},
		// 切换当前笔记本
		switchCurrentNotebook(notebook){
			this.$store.commit('switchCurrentNotebook', notebook);
		},
		// 更新meta信息
		updateMeta(metaData){
			this.$store.commit('updateNotebooks', metaData.notebook);
		},
		// 导入备份
		importBackup(){
			logger.ga('send', 'event', 'note', 'importBackup');
			this.$store.dispatch('importBackup');
		},
		// 导出指定格式
		export(format){
			logger.ga('send', 'event', 'note', 'export', format);
			this.$store.dispatch('export', format);
		},
		// 复制指定格式
		copy(format){
			logger.ga('send', 'event', 'note', 'copy', format);
			this.$store.dispatch('copy', format);
		},
		// 切换界面布局
		switchLayout(component){
			logger.ga('send', 'event', 'app', 'layout', component);
			this.$store.commit('switchLayout', component);
		},
		// 查看当前右键历史版本
		versionOpen(){
			logger.ga('send', 'event', 'history', 'switchActiveVersion');
			this.$store.dispatch('switchActiveVersion');
		},
		// 恢复当前右键历史版本
		versionRestore(){
			logger.ga('send', 'event', 'history', 'restoreActiveVersion');
			this.$store.dispatch('restoreActiveVersion');
		},
		// 编辑相关操作（撤销/重做）
		doEdit(action){
			this.$store.commit('editAction', action);
			this.$nextTick(() => {
				this.$store.commit('editAction', '');
			});
		},
		// 清除数据
		clearData(){
			this.$store.dispatch('clearData');
		}
		/******************菜单响应结束*****************/
	},
	data(){
		let data = {
			isShow:menu.isVue,
			menuList:this.getMenu()
		};
		return data;
	},
	mounted(){
		menu.buildMenu(this.menuList);

		// 处理菜单绑定
		menu.on('click',(eventType, command) => {
			switch(command){
				// 关于 - 仅windows下触发
				case 'about':
					getConfig('dataVersion').then((version) => {
						alert(`TooNote (${version})\nhttps://xiaotu.io`);
					});
					break;
				case 'devReload':
					location.reload(true);
					break;
				case 'newNote':
					this.newNote();
					break;
				case 'noteOpen':
					this.openContextMenuNote();
					break;
				case 'noteDelete':
					if(confirm('确定要删除该笔记吗？删除后将无法找回该笔记内容')){
						this.deleteContextMenuNote();
					}
					break;
				case 'noteHistory':
					this.historyContextMenuNote();
					break;
				case 'importBackup':
					this.importBackup();
					break;
				case 'exportMd':
					this.export('md');
					break;
				case 'exportHtmlBody':
					this.export('htmlBody');
					break;
				case 'exportHtmlBodyWithCss':
					this.export('htmlBodyWithCss');
					break;
				case 'exportHtml':
					this.export('html');
					break;
				case 'exportPdf':
					this.export('pdf');
					break;
				case 'switchLayoutSidebar':
					this.switchLayout('sidebar');
					break;
				case 'switchLayoutEditor':
					this.switchLayout('editor');
					break;
				case 'switchLayoutPreview':
					this.switchLayout('preview');
					break;
				case 'versionOpen':
					this.versionOpen();
					break;
				case 'versionRestore':
					this.versionRestore();
					break;
				case 'undo':
					this.doEdit('undo');
					break;
				case 'redo':
					this.doEdit('redo');
					break;
				case 'clearData':
					this.clearData();
					break;
				case 'copyFullMd':
					this.copy('md');
					break;
				case 'copyFullHTML':
					this.copy('html');
					break;
				case 'copyFullHTMLForWx':
					this.copy('wx');
					break;
			}

		});
	}
};
</script>
