import app from './component/app';

import menu from './modules/menu';
import meta from './modules/meta';
import note from './modules/note';

async function init(){
	try{
		app.metaData = await meta.data;

		app.updateMeta(app.metaData);

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

		app.switchCurrentNote(app.currentNote);

	}catch(e){
		console.log(e);
		throw e;
	}

	// 处理菜单绑定
	menu.on('click',function(eventType, command){
		switch(command){
			case 'devReload':
				location.reload(true);
				break;
			case 'newNote':
				app.newNote();
				break;
			case 'noteOpen':
				app.openContextMenuNote();
				break;
			case 'noteDelete':
				if(confirm('确定要删除该笔记吗？删除后将无法找回该笔记内容')){
					app.deleteContextMenuNote();
				}
				break;
			case 'noteHistory':
				app.historyContextMenuNote();
				break;
			case 'importBackup':
				app.importBackup();
				break;
			case 'exportMd':
				app.export('md');
				break;
			case 'exportHtmlBody':
				app.export('htmlBody');
				break;
			case 'exportHtmlBodyWithCss':
				app.export('htmlBodyWithCss');
				break;
			case 'exportHtml':
				app.export('html');
				break;
			case 'exportPdf':
				app.export('pdf');
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
			case 'versionOpen':
				app.versionOpen();
				break;
			case 'versionRestore':
				app.versionRestore();
				break;
			case 'undo':
				app.doEdit('undo');
				break;
			case 'redo':
				app.doEdit('redo');
				break;
		}

	});

}

init();

