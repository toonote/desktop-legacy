import Vue from 'vue';
// Vue.config.debug = true;
import Sidebar from './component/sidebar.vue';
import Editor from './component/editor.vue';
import Preview from './component/preview.vue';
import Menubar from './component/menubar.vue';

import meta from './modules/meta';
import note from './modules/note';
import menu from './modules/menu';

let app = new Vue({
	el: 'body',
	data:{
		metaData:{},
		currentNote:{},
		currentNotebook:{},
		withMenubar:true
	},
	events: {
		toggleMenubar: (isShow) => {
			app.withMenubar = isShow;
		},
		currentNoteContentChange: (content) => {
			app.currentNote.content = content;
			note.saveNoteContent(app.currentNote, true);
			app.$broadcast('currentNoteContentChange',content);
		}
	},
	components: {
		menubar: Menubar,
		sidebar: Sidebar,
		editor: Editor,
		preview: Preview
	}
});

(async function(){
	try{
		app.$broadcast('metaWillChange');
		var metaText = await meta.getData();
		var metaData;
		if(!metaText){
			metaData = await meta.initData();
			await note.initData(metaData.notebook[0].notes[0].id);
		}else{
			metaData = JSON.parse(metaText);
		}
		app.metaData = metaData;
		app.$broadcast('metaDidChange', metaData);
		app.$broadcast('currentNodeWillChange');
		var shouldChangeCurrentNote = true;
		// var shouldChangeCurrentNote = false;
		/*if(!app.currentNote.id){
			shouldChangeCurrentNote = true;
		}*/
		// todo:扫描所有笔记，看当前笔记还是否存在
		if(shouldChangeCurrentNote){
			app.currentNotebook = metaData.notebook[0];
			var noteMeta = Object.assign({},app.currentNotebook.notes[0]);
			noteMeta.content = await note.getNote(noteMeta.id);
			console.log(noteMeta);
			app.currentNote = noteMeta;
			app.$broadcast('currentNoteDidChange', app.currentNote);
		}
	}catch(e){
		console.log(e);
		throw e;
	}

	var newNote = async function(){
		// todo
		var noteMeta = await meta.addNote(app.metaData, app.currentNotebook);
		await note.addNote(noteMeta);
		app.currentNote = noteMeta;
		app.$broadcast('currentNoteDidChange', app.currentNote);
		app.$broadcast('metaDidChange', app.metaData);

	}

	menu.on('click',function(eventType, command){
		switch(command){
			case 'newNote':
				newNote();
				break;
		}

	});
})();

