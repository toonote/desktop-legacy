var openNewWindow = function(cssArr,jsArr,action,message){

	var newWindow = window.open('file://' + __dirname + '/blank.html','newWindow','');
	
	newWindow.webContents.on('did-finish-load',function(){
		console.log('ready');
		newWindow.webContents.send('loadCss',cssArr);
		newWindow.webContents.send('loadJs',jsArr);
		newWindow.webContents.send(action,message);
		// 开发环境打开调试工具
		if(!/app$/.test(__dirname)){
			newWindow.openDevTools();
		}
	});
};

exports.openNoteInNewWindow = function(note){
	openNewWindow([
		'./editor.css',
		'./monokai_sublime.css'
	],[
		'./highlight.pack.js',
	],'loadNote',note);
};

exports.renderPreview = function(note){
	var $preview = document.querySelector('#preview');
	var marked = require('marked');
	var previewRenderer = new marked.Renderer();
	var index = 0;
	previewRenderer.heading = function (text, level) {
		return '<h' + level + '><a name="anchor'+(index++)+'">'+ text + '</a></h' + level + '>';
	};
	var html = marked(note.content,{renderer:previewRenderer});
	$preview.innerHTML = html;

	Array.prototype.forEach.call($preview.querySelectorAll('pre code'),function($code){
		hljs.highlightBlock($code.parentNode);
	});
	var todo = require('./todo');
	var $allLi = $preview.querySelectorAll('li');
	for(var i = $allLi.length;i--;){
		var $li = $allLi[i];
		$li.innerHTML = todo.parseTodo($li.innerHTML);
	}

	var toc = require('marked-toc');
	var tocMarkdown = toc(note.content);
	var tocRenderer = new marked.Renderer();
	index = 1;
	tocRenderer.link = function(href,title,text){
		return '<a href="#anchor'+(index++)+'" title="'+text+'">'+text+'</a>';
	};
	var tocHtml = marked(tocMarkdown,{renderer:tocRenderer});
	var $toc = document.querySelector('#toc');
	if(tocHtml){
		$toc.innerHTML = tocHtml;
		$toc.classList.remove('hide');
	}else{
		$toc.classList.add('hide');
	}
}