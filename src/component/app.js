import Vue from 'vue';
import Vuex from 'vuex';

import sidebar from './sidebar.vue';
import editor from './editor.vue';
import preview from './preview.vue';
import menubar from './menubar.vue';
import versions from './versions.vue';

// 生成store
import getStore from '../vuex/store';

// 使用Vuex
Vue.use(Vuex);

// store
let store = getStore();

let app = new Vue({
	el: '#wrapper',
	store,
	computed:{
		...Vuex.mapGetters(['layout'])
	},
	methods:{
		// 新建笔记
		newNote(){
			window.ga('send', 'event', 'note', 'new');
			store.dispatch('newNote');
		},
		// 切换当前笔记
		switchCurrentNote(note){
			window.ga('send', 'event', 'note', 'switchCurrentNote', 'init');
			store.commit('switchCurrentNote', note);
		},
		// 打开当前右键笔记
		openContextMenuNote(){
			window.ga('send', 'event', 'note', 'switchCurrentNote', 'contextMenu');
			store.dispatch('openContextMenuNote');
		},
		// 删除当前右键笔记
		deleteContextMenuNote(){
			window.ga('send', 'event', 'note', 'delete', 'contextMenu');
			store.dispatch('deleteContextMenuNote');
		},
		// 查看当前右键笔记历史版本
		historyContextMenuNote(){
			window.ga('send', 'event', 'history', 'enter', 'contextMenu');
			store.dispatch('historyContextMenuNote');
		},
		// 切换当前笔记本
		switchCurrentNotebook(notebook){
			store.commit('switchCurrentNotebook', notebook);
		},
		// 更新meta信息
		updateMeta(metaData){
			store.commit('updateNotebooks', metaData.notebook);
		},
		// 导入备份
		importBackup(){
			window.ga('send', 'event', 'note', 'importBackup');
			store.dispatch('importBackup');
		},
		// 导出指定格式
		export(format){
			window.ga('send', 'event', 'note', 'export', format);
			store.dispatch('export', format);
		},
		// 切换界面布局
		switchLayout(component){
			window.ga('send', 'event', 'app', 'layout', component);
			store.commit('switchLayout', component);
		},
		// 查看当前右键历史版本
		versionOpen(){
			window.ga('send', 'event', 'history', 'switchActiveVersion');
			store.dispatch('switchActiveVersion');
		},
		// 恢复当前右键历史版本
		versionRestore(){
			window.ga('send', 'event', 'history', 'restoreActiveVersion');
			store.dispatch('restoreActiveVersion');
		},
		// 编辑相关操作（撤销/重做）
		doEdit(action){
			store.commit('editAction', action);
		}
	},
	data:{
		withMenubar:false
	},
	components: {
		menubar,
		sidebar,
		editor,
		preview,
		versions
	}
});

export default app;
