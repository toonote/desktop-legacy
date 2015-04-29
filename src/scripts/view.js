var View = function(){};
var util = require('util');
util.inherits(View, require('events').EventEmitter);
var _view = new View();


var $editor = document.querySelector('#editor');
var $preview = document.querySelector('#preview');
var $sidebar = document.querySelector('#sidebar');

var openNewWindow = function(cssArr,jsArr,action,message){

	var newWindow = window.open('file://' + __dirname + '/../blank.html','newWindow','');
	
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

_view.openNoteInNewWindow = function(note){
	openNewWindow([
		'./editor.css',
		'./monokai_sublime.css'
	],[
		'./highlight.pack.js',
	],'loadNote',note);
};

_view.renderPreview = function(note){
	var $preview = document.querySelector('#preview');
	var Remarkable = require('remarkable');
	// var marked = require('marked');
	// var previewRenderer = new marked.Renderer();
	var previewRenderer = new Remarkable();
	var index = 0;
	/*previewRenderer.heading = function (text, level) {
		return '<h' + level + '><a name="anchor'+(index++)+'">'+ text + '</a></h' + level + '>';
	};*/
	// var html = marked(note.content,{renderer:previewRenderer});
	previewRenderer.renderer.rules.paragraph_open = function (tokens, idx) {
		var line;
		if (tokens[idx].lines && tokens[idx].level === 0) {
			line = tokens[idx].lines[0];
			return '<p class="line" data-line="' + line + '">';
		}
		return '<p>';
	};

	previewRenderer.renderer.rules.heading_open = function (tokens, idx) {
		var line;
		if (tokens[idx].lines && tokens[idx].level === 0) {
			line = tokens[idx].lines[0];
			return '<h' + tokens[idx].hLevel + ' class="line" data-line="' + line + '">';
		}
		return '<h' + tokens[idx].hLevel + '>';
	};
	var html = previewRenderer.render(note.content);
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

	/*var toc = require('marked-toc');
	var tocMarkdown = toc(note.content);
	var tocRenderer = new marked.Renderer();
	index = 1;
	tocRenderer.link = function(href,title,text){
		return '<a href="#anchor'+(index++)+'" title="'+text+'">'+text+'</a>';
	};
	var tocHtml = marked(tocMarkdown,{renderer:tocRenderer});
	var $toc = document.querySelector('#toc');
	if(tocHtml && this.isVisible('preview')){
		$toc.innerHTML = tocHtml;
		$toc.classList.remove('hide');
	}else{
		$toc.classList.add('hide');
	}*/
};

_view.init = function(){
	var _this = this;
	var hideTabs = JSON.parse(localStorage.getItem('toonote_hideTabs') || '[]');
	window.addEventListener('DOMContentLoaded',function(){
		hideTabs.forEach(function(hideTab){
			_this.switchVisible(hideTab);
		});
	});
};

// 切换各栏显示状态
_view.switchVisible = function(eleName){

	var $ele;

	switch(eleName){
		case 'sidebar':
			$ele = $sidebar;
			break;
		case 'editor':
			$ele = $editor;
			break;
		case 'preview':
			$ele = $preview;
			break;
	}

	if($ele.classList.contains('hide')){
		$ele.classList.remove('hide');
	}else{
		$ele.classList.add('hide');
	}

	var sidebarVisible = !$sidebar.classList.contains('hide');
	var editorVisible = !$editor.classList.contains('hide');
	var previewVisible = !$preview.classList.contains('hide');

	var editorStatus = sidebarVisible?
		(previewVisible?'normal':'aloneWithSidebar'):
		(previewVisible?'noSidebar':'alone');
	var previewStatus = sidebarVisible?
		(editorVisible?'normal':'aloneWithSidebar'):
		(editorVisible?'noSidebar':'alone');

	if(editorVisible){
		$editor.classList.remove('aloneWithSidebar','noSidebar','alone');
		$editor.classList.add(editorStatus);
	}
	if(previewVisible){
		$preview.classList.remove('aloneWithSidebar','noSidebar','alone');
		$preview.classList.add(previewStatus);
	}

	var hideTabs = [];
	if(!sidebarVisible){
		hideTabs.push('sidebar');
	}
	if(!editorVisible){
		hideTabs.push('editor');
	}
	if(!previewVisible){
		hideTabs.push('preview');
	}

	// 处理TOC显示隐藏
	if(hideTabs.indexOf('preview') > -1){
		document.querySelector('#toc').classList.add('hide');
	}else{
		document.querySelector('#toc').classList.remove('hide');
	}

	_view.emit('layoutChange',hideTabs);

	localStorage.setItem('toonote_hideTabs',JSON.stringify(hideTabs));

};

_view.isVisible = function(eleName){
	var hideTabs = JSON.parse(localStorage.getItem('toonote_hideTabs') || '[]');
	return hideTabs.indexOf(eleName) === -1;
};

var bindEvents = function(){

	// 折叠笔记
	$sidebar.querySelector('#noteList').addEventListener('click',function(e){
		if(e.target.tagName !== 'LI') return false;
		var $tmpNode = e.target.nextSibling;
		if(!$tmpNode) return;
		var thisLevel = +e.target.dataset.level;
		var isVisible = getComputedStyle($tmpNode).display !== 'none';
		while($tmpNode && +$tmpNode.dataset.level > thisLevel){
			if(isVisible){
				$tmpNode.style.display = 'none';
			}else{
				$tmpNode.style.display = '';
			}
			$tmpNode = $tmpNode.nextSibling;
		}

	},false);
};

_view.syncScroll = function(editor){
	var scrollMap = [];
	var lastBuildTime = 0;
	var buildScrollMap = function(){
		var $previewAnchors = $preview.querySelectorAll('h1,h2,h3,h4,h5,h6,p');
		Array.prototype.forEach.call($previewAnchors, function($previewAnchor){
			if(typeof $previewAnchor.dataset.line !== 'undefined'){
				scrollMap[$previewAnchor.dataset.line] = $previewAnchor.offsetTop;
			}
		});

		var content = editor.getContent();
		var contentLines = content.split('\n').length;
		if(!scrollMap[0]) scrollMap[0] = 0;
		if(!scrollMap[contentLines - 1]) scrollMap[contentLines - 1] = $preview.scrollHeight;
		for(var i = 1; i<contentLines -1; i++){
			if(!scrollMap[i]){
				var j = i+1;
				while(!scrollMap[j] && j < contentLines - 1){
					j++;
				}
				scrollMap[i] = scrollMap[i-1] + (scrollMap[j] - scrollMap[i-1]) / (j-i+1);
			}
		}
		// console.log(scrollMap);
		lastBuildTime = Date.now();
		return scrollMap;
	};

	var isRunning = false;
	var currentScroll;
	var delta;
	var lastTime;
	var animateDuring;
	var animatedScroll = function($elem, target, during){
		
		currentScroll = $elem.scrollTop;
		delta = target - currentScroll;
		if(!delta) return;
		lastTime = 0;
		animateDuring = during;

		// console.log('target:%d,delta:%d',target,delta);

		var animateFunc = function(time){
			if(lastTime){
				var timeDelta = time - lastTime;
				var animateDelta = delta * (timeDelta / animateDuring);
				// console.log('timeDelta %d, animateDelta, %d', timeDelta, animateDelta);
				if(Math.abs(animateDelta) < 1){
					$elem.scrollTop = target;
					isRunning = false;
				}else{
					$elem.scrollTop += animateDelta;
				}
			}
			lastTime = time;
			if((delta > 0 && $elem.scrollTop >= target) || (delta < 0 && $elem.scrollTop <= target) ||
				$elem.scrollTop + $elem.clientHeight >= $elem.scrollHeight){
				$elem.scrollTop = target;
				isRunning = false;
			}else if(!isRunning){
				$elem.scrollTop = target;
				isRunning = false;
			}else{
				requestAnimationFrame(animateFunc);
			}
		};
		if(!isRunning){
			isRunning = true;
			requestAnimationFrame(animateFunc);
		}
	};

	
	var waitStart = Date.now();
	editor.session.on('changeScrollTop', function(scroll) {
		if(!lastBuildTime || Date.now() - lastBuildTime > 5000){
			buildScrollMap();
		}
		var targetRow = editor.getFirstVisibleRow();

		if(Date.now() - waitStart < 500) return;
		animatedScroll($preview, scrollMap[targetRow], 500);
		waitStart = Date.now();
		// console.log('scroll',scroll);
	});
};

bindEvents();

module.exports = _view;