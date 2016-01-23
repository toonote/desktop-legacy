import Vue from 'vue';
// Vue.config.debug = true;
import Sidebar from './component/sidebar.vue';
import Editor from './component/editor.vue';
import Preview from './component/preview.vue';
import Menubar from './component/menubar.vue';

// import config from './modules/config';
import menu from './modules/menu';
import meta from './modules/meta';
import note from './modules/note';

let app = new Vue({
	el: 'body',
	methods:{
		_getTitle(content){
			return content.split('\n',2)[0].replace(/^[# \xa0]*/g,'');
		},
		async onCurrentNoteContentChange(content){
			var title = app._getTitle(content);
			if(title !== app.currentNote.title){
				app.currentNote.title = title;

				app.$broadcast('metaWillChange');
				app.metaData = await meta.updateNote(app.currentNote.id,app.currentNote.title);
				app.$broadcast('metaDidChange',app.metaData);
			}
			app.currentNote.content = content;
			note.saveNoteContent(app.currentNote, true);
			app.$broadcast('currentNoteContentChange',content);
		}
	},
	data:{
		currentNote:{},
		currentNotebook:{},
		withMenubar:false
	},
	events: {
		toggleMenubar: (isShow) => {
			app.withMenubar = isShow;
		},
		currentNoteContentChange: (content) => {
			app.onCurrentNoteContentChange(content);
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
		app.metaData = await meta.data;
		app.$broadcast('metaDidChange', app.metaData);

		// 初始化欢迎笔记
		if(!app.metaData.init){
			await note.init(app.metaData.notebook[0].notes[0].id);
			await meta.init();
		}

		app.$broadcast('currentNoteWillChange', app.currentNote);
		app.currentNotebook = app.metaData.notebook[0];
		var noteMeta = Object.assign({},app.currentNotebook.notes[0]);
		noteMeta.content = await note.getNote(noteMeta.id);
		app.currentNote = noteMeta;
		app.$broadcast('currentNoteDidChange', app.currentNote);
	}catch(e){
		console.log(e);
		throw e;
	}

	var newNote = async function(){
		app.$broadcast('metaWillChange');
		var noteMeta = await meta.addNote(app.currentNotebook.id);
		app.metaData = await meta.data;
		app.$broadcast('metaDidChange', app.metaData);
		await note.addNote(noteMeta);
		app.$broadcast('currentNoteWillChange', app.currentNote);
		app.currentNote = noteMeta;
		app.$broadcast('currentNoteDidChange', app.currentNote);


	}

	menu.on('click',function(eventType, command){
		switch(command){
			case 'newNote':
				newNote();
				break;
		}

	});
})();

