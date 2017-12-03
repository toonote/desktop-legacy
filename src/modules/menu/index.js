import debug from '../util/debug';
import Menu from './electron';
import env from  '../util/env';
import * as controller from '../controller';

const logger = debug('menu');

const getMenu = function(){
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
	if(env.os === 'windows'){
		menuList = [fileMenu,editMenu,viewMenu,helpMenu];
	}
	return menuList;
};

// 处理菜单绑定
const onMenuClick = function(eventType, command){
	logger('onMenuClick', eventType, command);
	// 旧版command是一个字符串
	// 新版是一个对象，包含{data,event}
	let data = {};
	if(typeof command === 'object'){
		data = command.data;
		command = command.event;
	}
	switch(command){
		// 关于 - 仅windows下触发
		case 'about':
			const version = require('electron').remote.app.getVersion();
			alert(`TooNote (${version})\nhttps://xiaotu.io`);
			break;
		case 'devReload':
			location.reload(true);
			break;
		case 'newNote':
			controller.newNote();
			break;
		case 'noteOpen':
			logger('ready to switchCurrentNote');
			controller.switchCurrentNote(data.targetId);
			break;
		case 'noteDelete':
			logger('noteDelete');
			if(confirm('确定要删除该笔记吗？删除后将无法找回该笔记内容')){
				controller.deleteNote(data.targetId);
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

};

export function init(){
	const menu = new Menu();
	const menuList = getMenu();
	menu.buildMenu(menuList);
	menu.on('click', onMenuClick);
}


		/******************以下为菜单响应*****************/
		/* // 新建笔记
		newNote(){
			logger.ga('send', 'event', 'note', 'new');
			// this.$store.dispatch('newNote');
		},
		// 切换当前笔记
		switchCurrentNote(note){
			logger.ga('send', 'event', 'note', 'switchCurrentNote', 'init');
			// this.$store.commit('switchCurrentNote', note);
		},
		// 打开当前右键笔记
		openContextMenuNote(){
			logger.ga('send', 'event', 'note', 'switchCurrentNote', 'contextMenu');
			// this.$store.dispatch('openContextMenuNote');
		},
		// 删除当前右键笔记
		deleteContextMenuNote(){
			logger.ga('send', 'event', 'note', 'delete', 'contextMenu');
			// this.$store.dispatch('deleteContextMenuNote');
		},
		// 查看当前右键笔记历史版本
		historyContextMenuNote(){
			logger.ga('send', 'event', 'history', 'enter', 'contextMenu');
			// this.$store.dispatch('historyContextMenuNote');
		},
		// 切换当前笔记本
		switchCurrentNotebook(notebook){
			// this.$store.commit('switchCurrentNotebook', notebook);
		},
		// 更新meta信息
		updateMeta(metaData){
			// this.$store.commit('updateNotebooks', metaData.notebook);
		},
		// 导入备份
		importBackup(){
			logger.ga('send', 'event', 'note', 'importBackup');
			// this.$store.dispatch('importBackup');
		},
		// 导出指定格式
		export(format){
			logger.ga('send', 'event', 'note', 'export', format);
			// this.$store.dispatch('export', format);
		},
		// 复制指定格式
		copy(format){
			logger.ga('send', 'event', 'note', 'copy', format);
			// this.$store.dispatch('copy', format);
		},
		// 切换界面布局
		switchLayout(component){
			logger.ga('send', 'event', 'app', 'layout', component);
			// this.$store.commit('switchLayout', component);
		},
		// 查看当前右键历史版本
		versionOpen(){
			logger.ga('send', 'event', 'history', 'switchActiveVersion');
			// this.$store.dispatch('switchActiveVersion');
		},
		// 恢复当前右键历史版本
		versionRestore(){
			logger.ga('send', 'event', 'history', 'restoreActiveVersion');
			// this.$store.dispatch('restoreActiveVersion');
		},
		// 编辑相关操作（撤销/重做）
		doEdit(action){
			// this.$store.commit('editAction', action);
			this.$nextTick(() => {
				// this.$store.commit('editAction', '');
			});
		},
		// 清除数据
		clearData(){
			// this.$store.dispatch('clearData');
		} */
		/******************菜单响应结束*****************/
