import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);
let store = require('./vuex/store');

// Vue.config.debug = true;
import Sidebar from './component/sidebar.vue';
import Editor from './component/editor.vue';
import Preview from './component/preview.vue';
import Menubar from './component/menubar.vue';

// import config from './modules/config';
import menu from './modules/menu';
import meta from './modules/meta';
import note from './modules/note';

// window.eventHub = new Vue();

let app = new Vue({
	el: '#wrapper',
	store,
	computed:{
		...Vuex.mapGetters(['layout'])
	},
	watch:{
		layout(){
			console.log('layout changed', this.layout);
		}
	},
	methods:{
		_getTitle(content){
			return content.split('\n',2)[0].replace(/^[# \xa0]*/g,'');
		},
		newNote(){
			store.dispatch('newNote');
		},
		switchCurrentNote(note){
			store.commit('switchCurrentNote', note);
		},
		openContextMenuNote(){
			store.dispatch('openContextMenuNote');
		},
		deleteContextMenuNote(){
			store.dispatch('deleteContextMenuNote');
		},
		switchCurrentNotebook(notebook){
			store.commit('switchCurrentNotebook', notebook);
		},
		updateMeta(metaData){
			store.commit('updateNotebooks', metaData.notebook);
		},
		importBackup(){
			store.dispatch('importBackup');
		},
		switchLayout(component){
			store.commit('switchLayout', component);
		}
	},
	data:{
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
		console.log(app.$store);
		// eventHub.$emit('metaWillChange');
		app.metaData = await meta.data;

		app.updateMeta(app.metaData);
		// eventHub.$emit('metaDidChange', app.metaData);

		// 初始化欢迎笔记
		if(!app.metaData.init){
			await note.init(app.metaData.notebook[0].notes[0].id);
			await meta.init();
		}

		app.currentNotebook = app.metaData.notebook[0];
		app.switchCurrentNotebook(app.currentNotebook);


		var noteMeta = Object.assign({},app.currentNotebook.notes[0]);
		noteMeta.content = await note.getNote(noteMeta.id);
		app.currentNote = noteMeta;

		// vuex:new
		app.switchCurrentNote(app.currentNote);

	}catch(e){
		console.log(e);
		throw e;
	}

	menu.on('click',function(eventType, command){
		switch(command){
			case 'newNote':
				app.newNote();
				break;
			case 'devReload':
				location.reload(true);
				break;
			case 'noteOpen':
				app.openContextMenuNote();
				break;
			case 'noteDelete':
				if(confirm('确定要删除该笔记吗？删除后将无法找回该笔记内容')){
					app.deleteContextMenuNote();
				}
				break;
			case 'importBackup':
				app.importBackup();
				break;
			case 'switchLayoutSidebar':
				app.switchLayout('sidebar');
				break;
			case 'switchLayoutEditor':
				app.switchLayout('editor');
				break;
			case 'switchLayoutPreview':
				app.switchLayout('preview');
				break;
		}

	});
})();

