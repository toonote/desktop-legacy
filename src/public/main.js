import Vue from 'vue';
// Vue.config.debug = true;
import Sidebar from './component/sidebar.vue';
import Editor from './component/editor.vue';
import Preview from './component/preview.vue';

let app = new Vue({
	el: 'body',
	data:{
		currentNote:{
		}
	},
	events: {
		sourceChange: (content) => {
			app.$broadcast('sourceChange',content);
		}
	},
	components: {
		sidebar: Sidebar,
		editor: Editor,
		preview: Preview
	}
});

import meta from './modules/meta';

(async function(){
	try{
		var metaText = await meta.getData();
		var metaData;
		if(!metaText){
			metaData = await meta.initData();
		}else{
			metaData = JSON.parse(metaText);
		}
		app.$broadcast('metaUpdate', metaData);
		var shouldChangeCurrentNote = false;
		if(!app.currentNote.id){
			shouldChangeCurrentNote = true;
		}
		// todo:扫描所有笔记，看当前笔记还是否存在
		if(shouldChangeCurrentNote){
			app.currentNote = metaData.notebook[0].notes[0];
			app.$broadcast('currentNoteUpdate', app.currentNote);
		}
	}catch(e){
		console.log(e);
		throw e;
	}
})();

