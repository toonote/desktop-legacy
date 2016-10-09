import Vue from 'vue/dist/vue.js';
// Vue.config.debug = true;
import Sidebar from './component/sidebar.vue';
import Editor from './component/editor.vue';
import Preview from './component/preview.vue';
import Menubar from './component/menubar.vue';

// import config from './modules/config';
import menu from './modules/menu';
import meta from './modules/meta';
import note from './modules/note';

window.eventHub = new Vue();

let app = new Vue({
	el: '#wrapper',
	/*created: function () {
		// eventHub.$on('toggleMenubar', this.toggleMenubar);
		// eventHub.$on('currentNoteContentChange', this.currentNoteContentChange);
		// eventHub.$on('currentNoteChange', this.currentNoteChange);
	},
	beforeDestroy: function () {
		eventHub.$off('toggleMenubar', this.toggleMenubar);
		eventHub.$off('currentNoteContentChange', this.currentNoteContentChange);
		eventHub.$off('currentNoteChange', this.currentNoteChange);
	},*/
	methods:{
		_getTitle(content){
			return content.split('\n',2)[0].replace(/^[# \xa0]*/g,'');
		},
		/*async currentNoteContentChange(content){
			var title = app._getTitle(content);
			if(title !== app.currentNote.title){
				app.currentNote.title = title;

				eventHub.$emit('metaWillChange');
				app.metaData = await meta.updateNote(app.currentNote.id,app.currentNote.title);
				eventHub.$emit('metaDidChange',app.metaData);
			}
			app.currentNote.content = content;
			note.saveNoteContent(app.currentNote, true);
			// eventHub.$emit('currentNoteContentChange',content);
		},
		toggleMenubar: (isShow) => {
			console.log(2);
			app.withMenubar = isShow;
		},
		async currentNoteChange(noteId){
			console.log(3);
			eventHub.$emit('currentNoteWillChange');
			var noteMeta = Object.assign({},await meta.findNoteById(noteId));
			noteMeta.content = await note.getNote(noteMeta.id);
			app.currentNotebook = await meta.findNotebookOfNote(noteId);
			app.currentNote = noteMeta;
			eventHub.$emit('currentNoteDidChange', app.currentNote);
		}*/
	},
	data:{
		currentNote:{},
		currentNotebook:{},
		withMenubar:false
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
		eventHub.$emit('metaWillChange');
		app.metaData = await meta.data;
		eventHub.$emit('metaDidChange', app.metaData);

		// 初始化欢迎笔记
		if(!app.metaData.init){
			await note.init(app.metaData.notebook[0].notes[0].id);
			await meta.init();
		}

		eventHub.$emit('currentNoteWillChange');
		app.currentNotebook = app.metaData.notebook[0];
		var noteMeta = Object.assign({},app.currentNotebook.notes[0]);
		noteMeta.content = await note.getNote(noteMeta.id);
		app.currentNote = noteMeta;
		eventHub.$emit('currentNoteDidChange', app.currentNote);
	}catch(e){
		console.log(e);
		throw e;
	}

	var newNote = async function(){
		eventHub.$emit('metaWillChange');
		var noteMeta = await meta.addNote(app.currentNotebook.id);
		app.metaData = await meta.data;
		eventHub.$emit('metaDidChange', app.metaData);
		await note.addNote(noteMeta);
		eventHub.$emit('currentNoteWillChange', app.currentNote);
		app.currentNote = noteMeta;
		eventHub.$emit('currentNoteDidChange', app.currentNote);


	}

	menu.on('click',function(eventType, command){
		switch(command){
			case 'newNote':
				newNote();
				break;
			case 'devReload':
				location.reload(true);
				break;
		}

	});
})();

