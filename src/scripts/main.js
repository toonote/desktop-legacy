/*global hljs,alert,confirm*/
(function(){

	var packageJson = require('./package.json');
	var version = packageJson.version;

	var api = require('./scripts/api.js');
	var view = require('./scripts/view.js');
	var todo = require('./scripts/todo.js');

	var user = require('./scripts/user.js');

	user.on('login', function(){
		buildAppMenu({
			isLogin:true
		});
	});
	user.on('logout', buildAppMenu);

	view.init();
	todo.init();

	window.config = JSON.parse(localStorage.getItem('config') || '{}');

	var noteIndex = JSON.parse(localStorage.getItem('noteIndex')||'{}');
	/*var syncIndex = JSON.parse(localStorage.getItem('syncIndex') || '{}');
	if(!syncIndex.vdisk){
		syncIndex.vdisk = {};
		localStorage.setItem('syncIndex',JSON.stringify(syncIndex));
	}*/
	var currentNote = {};

	var $editor = document.querySelector('#editor');
	var $preview = document.querySelector('#preview');
	var $sidebar = document.querySelector('#sidebar');
	var saveTimer,saveInterval=1000;

	var isExporting = false;	//标记是否正在导出，如果是，则不替换有问题的图片

	var handleInput = function(){
		if(!saveTimer){
			saveTimer = setTimeout(function(){
				updateNote(currentNote);
				renderPreview();
				updateNoteIndex(title);
				// updateSyncIndex('vdisk');
				saveTimer = 0;
			},saveInterval);
		}
		currentNote.content = $editor.innerText;
		var title = getTitleByContent(currentNote.content);
	};

	// 输入响应
	$editor.addEventListener('input',handleInput,false);

	// 输入响应
	$editor.addEventListener('keydown',handleInput,false);

	// 粘贴响应
	$editor.addEventListener('paste',function(e){
		e.preventDefault();
		var text = e.clipboardData.getData('text/plain');
		text = getEditorContent(text);
		document.execCommand('insertHTML', false, text);
		// updateSyncIndex('vdisk');
	});

	// 编辑体验优化 - 响应TAB
	$editor.addEventListener('keydown',function(e){
		if(e.keyCode === 9){
			// TAB
			e.preventDefault();
			document.execCommand('insertHTML', false, '\t');
			/*var selection = window.getSelection();
			var range = selection.getRangeAt(0);

			var node = document.createTextNode('\t');
			range.insertNode(node);
			range.setEndAfter(node);
			range.setStartAfter(node);
			selection.removeAllRanges();
			selection.addRange(range);*/
		}
	});

	// 拖拽插图
	$editor.addEventListener('dragover',function(e){
		e.stopPropagation();
		e.preventDefault();
	});
	$editor.addEventListener('drop',function(e){
		console.log('drop');
		e.stopPropagation();
		e.preventDefault();
		var $currNode = e.target;
		var img = e.dataTransfer.files[0];
		if(!img || !/^image/.test(img.type)) return;

		// var ext = img.type.replace('image/','');
		var AV = require('avoscloud-sdk').AV;
		AV.initialize('pnj0o24lytzmcaoebtu3uoynwyuqqs687ch3nxpih0i45qid', 'ce3286s9l40kyj5erom2sjlc22tyqku6tn3na3v8s6h17jrs');
		var avFile = new AV.File(img.name, img);

		var $targetNode;

		if(/\S+/.test($currNode.innerText)){
			// 如果当前元素非空，插入下方
			var $nextNode = $currNode.nextSibling;
			var $parent = $currNode.parentNode;
			var $targetNode = document.createElement('div');
			var $blankNode = document.createElement('div');
			$blankNode.innerHTML = '<br />';
			if($nextNode){
				$parent.insertBefore($targetNode,$nextNode);
			}else{
				$parent.appendChild($targetNode);
			}
			$parent.insertBefore($blankNode,$targetNode);
		}else{
			// 如果当前元素为空，插入当前元素
			$targetNode = $currNode;
		}

		$targetNode.innerText = img.name + '上传中...';

		avFile.save().then(function(image) {
			$targetNode.innerText = '![' + img.name + '](' + image.url() + ')';
			currentNote.content = $editor.innerText;
			updateNote(currentNote);
			renderPreview();
		}, function(err) {
			console.log(err);
		});

	});

	// 搜索快捷键
	document.addEventListener('keydown',function(e){
		// ESC
		if(e.keyCode === 27){
			switchSearch(false);
			return;
		}
		// Enter(当搜索框可见的时候回车继续搜索)
		if(e.keyCode === 13){
			if(getComputedStyle(document.querySelector('#search')).display !== 'none'){
				document.querySelector('#search .searchBtn').click();
			}
		}
		return false;
	});

	// 搜索
	document.querySelector('#search .searchBtn').addEventListener('click',function(){
		// this.parentNode.parentNode.querySelector('button').click();
		var input = document.querySelector('#keyword');
		var keyword = input.value;
		var caseSensitive = false;
		var back = false;
		var wrap = false;
		var found = false;
		var selection;
		while(!found && window.find(keyword,caseSensitive,back,wrap)){
			selection = window.getSelection();
			var currNode = selection.baseNode.parentNode;
			while(!found && currNode.parentNode){
				if(currNode === $preview){
					found = true;
				}else{
					currNode = currNode.parentNode;
				}
			}
		}
		if(!found){
			selection = window.getSelection();
			selection.removeAllRanges();
			console.log('not found');
		}
	});

	// 图片出错处理
	$preview.addEventListener('error',function(e){
		if(isExporting) return;
		var $target = e.target;
		if($target.tagName === 'IMG'){
			$target.src = './images/404.jpg';
		}
	},true);

	// 链接
	$preview.addEventListener('click',function(e){
		var $target = e.target;
		if($target.tagName === 'A' && /^https?:\/\//.test($target.href)){
			var shell = require('shell');
			shell.openExternal($target.href);
			e.preventDefault();
		}
	},true);


	// 获取当前笔记
	document.querySelector('#noteList').addEventListener('click',function(e){
		if(e.target.tagName !== 'A') return false;
		var id = e.target.dataset.id;
		if(+id === 0){
			// 展开
			e.target.parentNode.click();
			return false;
		}
		currentNote.id = id;
		currentNote.content = localStorage.getItem('note_'+id);
		document.querySelector('#editor').innerHTML = getEditorContent(currentNote.content);
		renderPreview();
		setActiveNote(id);
	},false);

	// 删除当前笔记
	document.querySelector('#noteList').addEventListener('click',function(e){
		if(!e.target.classList.contains('delete')) return false;
		if(!confirm('确定要删除该笔记吗？')) return false;
		var id = e.target.parentNode.querySelector('a').dataset.id;
		delete noteIndex[id];
		localStorage.removeItem('note_'+id);
		updateNoteIndex();
		var $firstNoteIndex = document.querySelector('#noteList li a[data-id^="1"]');
		if($firstNoteIndex){
			$firstNoteIndex.click();
		}
		renderPreview();
	},false);

	// 同步当前笔记
	document.querySelector('#noteList').addEventListener('click',function(e){
		if(!e.target.classList.contains('vdisk')) return false;
		// if(!confirm('确定要删除该笔记吗？')) return false;
		var id = e.target.parentNode.querySelector('a').dataset.id;
		// var isSync = !e.target.classList.contains('ok');
		/*doSync('vdisk',id,isSync,function(err,result){
			if(err){
				console.log(err.message);
				return;
			}
			updateSyncIndex('vdisk',id,isSync);
		});
		if(isSync){
			e.target.classList.add('ok');
		}else{
			e.target.classList.remove('ok');
		}*/
	},false);

	// 折叠笔记
	document.querySelector('#noteList').addEventListener('click',function(e){
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

	// 新建笔记
	function newNote(){
		var id = Date.now();
		var thisNoteIndex = {};
		var random = (Math.random()+'').substr(2,4);
		thisNoteIndex[id] = 'Untitled\\'+random;
		updateNoteIndex(thisNoteIndex);
		currentNote.id = id;
		currentNote.content = '# Untitled\\'+random;
		updateNote(currentNote);
		$editor.innerHTML = '';
		renderNoteList();
		document.execCommand('insertHTML', false, '# Untitled\\'+random);
		setTimeout(function(){
			$editor.focus();
		},0);
	}

	// 保存
	function save(){
		if($editor.classList.contains('hide')) return;
		currentNote.content = JSON.parse(JSON.stringify($editor.innerText));
		currentNote.content = currentNote.content.replace(/\n$/,'');
		updateNote(currentNote);
		renderPreview();
	}

	// 打开markdown文件
	function openFile(){
		var remote = require('remote');
		var dialog = remote.require('dialog');
		var filePath = dialog.showOpenDialog({
			filters: [{
				name: 'Markdown文件',
				extensions: ['md', 'markdown']
			},{
				name: '纯文本文件',
				extensions: ['txt']
			}],
			properties: ['openFile']
		});
		if(!filePath || !filePath.length) return;
		filePath = filePath[0];

		var fs = require('fs');
		fs.readFile(filePath,'utf8',function(err,fileContent){
			if(err){
				alert('打开文件出错：\n'+err.message);
				return;
			}else{
				newNote();
				currentNote.content = fileContent;
				var title = getTitleByContent(currentNote.content);
				updateNoteIndex(title);
				updateNote(currentNote);
				$editor.innerHTML = getEditorContent(currentNote.content);
				renderPreview();
				renderNoteList();
			}
		});
	}

	// 导出为各种格式文件
	function saveAs(format){
		var filters = [];
		if(format === 'markdown'){
			filters.push({
				name: 'Markdown文件',
				extensions: ['md']
			});
		}else if(format === 'htmlbody' || format === 'htmlfile'){
			filters.push({
				name: 'HTML文件',
				extensions: ['html']
			});
		}else if(format === 'pdf'){
			filters.push({
				name: 'PDF文件',
				extensions: ['pdf']
			});
		}
		var remote = require('remote');
		var dialog = remote.require('dialog');
		var filePath = dialog.showSaveDialog({
			filters: filters,
			properties: ['createDirectory']
		});
		if(!filePath) return;

		var fs = require('fs');

		var content = currentNote.content;
		if(format !== 'markdown'){
			isExporting = true;
			view.renderPreview(currentNote);
			content = $preview.innerHTML;
			isExporting = false;
		}
		if(format === 'htmlfile' || format === 'pdf'){
			content = '<!doctype html><html>\n' +
					'<head>\n' + 
					'<meta charset="utf-8">\n' +
					'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
					'<title>' + noteIndex[currentNote.id] + '</title>\n' +
					'<style>\n' + fs.readFileSync(__dirname + '/render.css','utf8') + '</style>\n' +
					'</head>\n' +
					'<body class="preview">\n' + content + '</body>\n</html>';
		}

		if(format === 'pdf'){
			var pdfPath = filePath;
			var path = require('path');
			var cwd = path.dirname(filePath);
			// 如果是pdf，先生成一个临时HTML文件
			filePath = path.join(cwd,'tmp.htm');
		}
		fs.writeFile(filePath,JSON.parse(JSON.stringify(content))/*.substr(0,content.length-1)*/,function(err){
			if(err){
				alert('保存失败：\n' + err.message);
			}else if(format === 'pdf'){
				// 生成pdf
				var spawn = require('child_process').spawn;
				var pdfprocess = spawn(__dirname + '/lib/phantomjs',[
					__dirname + '/html2pdf.js',
					encodeURI(filePath),
					pdfPath
				],{
					cwd:cwd
				});
				pdfprocess.stdout.on('data',function(data){
					console.log('stdout'+data);
				});
				pdfprocess.stderr.on('data',function(data){
					console.log('stderr'+data);
				});
				pdfprocess.on('close',function(){
					console.log('closed');
					// 删除HTML文件
					fs.unlink(filePath,function(){
						console.log('htm deleted');
					});
				});
			}
		});
	}

	// 创建备份文件
	function createBackUp(){
		var filters = [{
			name: 'TooNote备份文件',
			extensions: ['tnt']
		}];
		var remote = require('remote');
		var dialog = remote.require('dialog');
		var filePath = dialog.showSaveDialog({
			filters: filters,
			properties: ['createDirectory']
		});
		if(!filePath) return;
		var zip = new require('jszip')();
		zip.file('index',JSON.stringify(noteIndex));
		for(var id in noteIndex){
			zip.file(id,JSON.stringify(localStorage.getItem('note_' + id)),{binary:false});
		}
		var data = zip.generate({base64:false,compression:'DEFLATE'});
		var fs = require('fs');
		fs.writeFile(filePath,data,'binary',function(err,result){
			if(!err){
				console.log('tnt create successed.');
			}else{
				console.log('tnt create fail.' + err.message);
			}
		});
	}

	// 从备份文件恢复
	function importBackUp(){
		var remote = require('remote');
		var dialog = remote.require('dialog');
		var filePath = dialog.showOpenDialog({
			filters: [{
				name: 'TooNote备份文件',
				extensions: ['tnt']
			}],
			properties: ['openFile']
		});
		if(!filePath || !filePath.length) return;
		filePath = filePath[0];

		var fs = require('fs');
		fs.readFile(filePath,'binary',function(err,fileContent){
			if(err){
				alert('打开文件出错：\n'+err.message);
				return;
			}else{
				var zip = new require('jszip')();
				zip.load(fileContent);
				var zipNoteIndex = JSON.parse(zip.files.index.asText() || '{}');
				if(!confirm('备份文件含有'+Object.keys(zipNoteIndex).length+'条笔记，如确认导入将覆盖当前所有笔记，请您再次确认是否要清除当前笔记并导入备份文件？')) return;
				noteIndex = zipNoteIndex;
				updateNoteIndex(zipNoteIndex);
				for(var id in noteIndex){
					updateNote({
						id:id,
						content:JSON.parse(zip.files[id].asText())
					});
				}
				var $firstNoteIndex = document.querySelector('#noteList li a[data-id^="1"]');
				if($firstNoteIndex){
					$firstNoteIndex.click();
				}
			}
		});
	}

	// 更新笔记内容
	function updateNote(obj){
		localStorage.setItem('note_'+obj.id,obj.content);
	}

	// 更新笔记索引
	function updateNoteIndex(obj){
		if(typeof obj === 'string'){
			noteIndex[currentNote.id] = obj;
		}else{
			for(var id in obj){
				noteIndex[id] = obj[id];
			}
		}
		localStorage.setItem('noteIndex',JSON.stringify(noteIndex));
		renderNoteList();
	}

	// 更新同步状态
	/*function updateSyncIndex(provider,id,isSync,remoteUpdateTime,updateLocal){
		var newIndex = {
			localUpdateTime:Date.now()
		};
		if(updateLocal){
			newIndex.localUpdateTime = remoteUpdateTime;
		}
		if(!id) id = currentNote.id;
		console.log('更新同步索引，ID：'+id+'，时间：'+newIndex.localUpdateTime+'，isSync：'+isSync);
		if(typeof isSync !== 'undefined'){
			if(isSync){
				newIndex.isSync = isSync;
				if(typeof remoteUpdateTime !== 'undefined'){
					newIndex.remoteUpdateTime = remoteUpdateTime;
				}
				syncIndex[provider][id] = newIndex;
			}else{
				delete syncIndex[provider][id];
			}
		}else{
			if(!syncIndex[provider][id]){
				syncIndex[provider][id] = {};
			}
			syncIndex[provider][id].localUpdateTime = newIndex.localUpdateTime;
		}
		localStorage.setItem('syncIndex',JSON.stringify(syncIndex));
	}*/

	// 同步笔记
	/*function doSync(provider,id,isSync,callback){
		if(isSync){
			api.syncNote(provider,id,localStorage.getItem('note_'+id),callback);
		}else{
			api.deleteNote(provider,id,callback);
		}
	}*/

	// 渲染笔记列表
	function renderNoteList(){

		/*
		 * [{
		 * 		id:1,
		 * 		title:'hello',
		 * 		children:[{
		 * 			id:1,
		 * 			title:'world'
		 * 		}]
		 * }] 
		 * @type {Array}
		 */
		var indexObj = [];

		for(var id in noteIndex){
			var titleArr = noteIndex[id].split('\\');
			var tmpPartParent = indexObj;
			var i = 0;
			while(typeof titleArr[i] !== 'undefined'){
				var part = titleArr[i];
				var partObj;
				var samePart = tmpPartParent.filter(function(existPart){
					return existPart.title === part;
				});
				if(!samePart.length){
					partObj = {
						title:part,
						children:[]
					};
					// 如果是文章，填充ID
					if(i === titleArr.length - 1){
						partObj.id = id;
					}
					tmpPartParent.push(partObj);
				}else{
					partObj = samePart[0];
				}
				tmpPartParent = partObj.children;
				i++;
			}
		}

		// var html = '';
		var level = 0;
		var html = genHtml(indexObj);

		document.querySelector('#noteList').innerHTML = html;

		if(!indexObj.length){
			newNote();
		}

		function genHtml(arr){
			var tmpHtml = '';
			tmpHtml = arr.map(function(arrItem){
				var tmpHtml = '<li class="level'+level+(+arrItem.id === +currentNote.id?' active':'')+'" data-level="'+level+'">';
				tmpHtml += '<a href="#" title="'+(arrItem.title || 'Untitled')+'" data-id="'+(arrItem.id || 0)+'">'+(arrItem.title || 'Untitled')+'</a>';
				tmpHtml += '<i title="删除笔记" class="delete">X</i>';
				// tmpHtml += '<i title="同步到微盘" class="vdisk'+(syncIndex.vdisk[arrItem.id] && syncIndex.vdisk[arrItem.id].isSync?' ok':'')+'">V</i>';
				if(arrItem.children.length){
					level++;
					// tmpHtml += '<ul>';
					tmpHtml += genHtml(arrItem.children);
					// tmpHtml += '</ul>';
					level--;
				}
				tmpHtml += '</li>';
				return tmpHtml;
			}).join('');
			return tmpHtml;
		}		

	}

	// 切换到指定ID的笔记
	function setActiveNote(id){
		var activeLi = document.querySelector('#noteList li.active');
		if(activeLi){
			activeLi.classList.remove('active');
		}
		document.querySelector('#noteList li a[data-id="'+id+'"]').parentNode.classList.add('active');
	}

	// 转换成markdown显示
	function renderPreview(){
		view.renderPreview(currentNote);
	}


	// 搜索框
	function switchSearch(isShow){
		var $search = document.querySelector('#search');
		var isVisible = getComputedStyle($search).display !== 'none';
		if(typeof isShow !== 'undefined'){
			isVisible = !isShow;
		}
		$search.style.display = isVisible?'none':'block';
		if(!isVisible){
			$search.querySelector('#keyword').value = '';
			setTimeout(function(){
				$search.querySelector('#keyword').focus();
			},0);
		}else{
			var selection = window.getSelection();
			selection.removeAllRanges();
		}
	}

	/*function vdiskSync(){
		api.oauth('vdisk',function(err){
			if(!err){
				localStorage.setItem('syncVdisk','true');
				startVdiskSync();
			}else{
				localStorage.setItem('syncVdisk','false');
				alert('授权出错：'+err.message);
			}
		});
	}*/

	/*function startVdiskSync(){
		// 每2分钟同步一次
		setTimeout(startVdiskSync,120*1000);

		// 拉取同步
		console.log('准备开始拉取远程笔记');
		api.pullSync('vdisk',function(id,remoteUpdateTime,content){
			console.log('从远程获取到笔记，标题为【'+(noteIndex[id] || '本地没有')+'】，ID:'+id+'，更新时间:'+remoteUpdateTime);
			if(!syncIndex.vdisk[id]){
				// 本地没有同步标记的，直接用远程覆盖
				console.log('本地没有同步标记');
				updateLocal();
			}else{
				console.log('本地有同步标记');
				// 本地有同步标记
				if(!syncIndex.vdisk[id].isSync){
					// 本地关闭了同步，删除远程
					console.log('本地文章关闭了同步');
					api.deleteNote('vdisk',id,function(){});
				}else{
					// 本地开启了同步
					console.log('本地文章启用了同步');
					if(syncIndex.vdisk[id].localUpdateTime >= remoteUpdateTime){
						console.log('本地文章较新，本地更新时间：'+syncIndex.vdisk[id].localUpdateTime);
						// 本地的比较新
						api.syncNote('vdisk',id,localStorage.getItem('note_'+id),function(err){
							if(err){
								console.log('同步错误');
							}
						});
					}else{
						console.log('远程文章较新，本地更新时间：'+syncIndex.vdisk[id].localUpdateTime);
						// 远程的比较新
						updateLocal();
					}
				}
			}
			function updateLocal(){
				localStorage.setItem('note_'+id,content);
				var title = getTitleByContent(content);
				var newIndex = {};
				newIndex[id] = title;
				updateSyncIndex('vdisk',id,true,remoteUpdateTime,true);
				updateNoteIndex(newIndex);
				renderNoteList();
				if(+id === +currentNote.id){
					currentNote.content = content;
					$editor.innerHTML = getEditorContent(content);
					updateNote(currentNote);
					renderPreview();
				}
			}
		});

		// 推送同步
		setTimeout(function(){
			console.log('开始推送本地笔记');
			for(var id in syncIndex.vdisk){
				var sync = syncIndex.vdisk[id];
				console.log('推送笔记【'+noteIndex[id]+'】，ID：'+id+'，sync:',sync);
				if(sync.isSync && (!sync.remoteUpdateTime || sync.localUpdateTime > sync.remoteUpdateTime)){
					console.log('开始推送');
					api.syncNote('vdisk',id,localStorage.getItem('note_'+id),function(err){
						if(err){
							console.log('推送失败',err);
						}else{
							console.log('推送成功');
						}
					});
				}else{
					console.log('无需推送');
				}
			}
		},60*1000);
		
	}*/

	// 从内容中提示标题
	function getTitleByContent(content){
		return content.split('\n',2)[0].replace(/^[# \xa0]*/g,'');
	}

	// 将内容变成编辑区显示的html
	function getEditorContent(content){
		return htmlEncode(content).split('\n').map(function(line){
			return '<div>' + (line||'<br />') + '</div>';
		}).join('');
	}

	// HTML编码
	function htmlEncode(str){
		return str.replace(/</g,'&lt;')
				.replace(/ /g,'&#32;')
				.replace(/>/g,'&gt;')
				.replace(/"/g,'&quot;')
				.replace(/'/g,'&apos;');
	}

	// 设置菜单
	function buildAppMenu(options){
		if(!options) options = {};
		var remote = require('remote');
		var Menu = remote.require('menu');

		var template = getAppMenuTmpl(options);
		var menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	}

	function getAppMenuTmpl(options){
		var template = [{
			label:'TooNote',
			submenu:[,{
				label:'关于',
				click:function(){
					alert('TooNote '+version+'\n\nTooBug荣誉出品');
				}
			},{
				type: 'separator'
			},{
				label:'退出',
				accelerator:'CommandOrControl+Q',
				click:function(){
					window.close();
				}
			}]
		},{
			label:'文件',
			submenu: [{
				label:'新建笔记',
				accelerator:'CommandOrControl+N',
				click:newNote
			},{
				label:'保存',
				accelerator:'CommandOrControl+S',
				click:save
			},{
				type: 'separator'
			},{
				label:'导入Markdown',
				accelerator:'CommandOrControl+O',
				click:openFile
			},{
				label:'导出Markdown',
				accelerator:'CommandOrControl+Shift+S',
				click:function(){
					saveAs('markdown');
				}
			},{
				type: 'separator'
			},{
				label:'导出HTML(Body)',
				click:function(){
					saveAs('htmlbody');
				}
			},{
				label:'导出HTML(完整)',
				click:function(){
					saveAs('htmlfile');
				}
			},{
				type: 'separator'
			},{
				label:'导出PDF',
				click:function(){
					saveAs('pdf');
				}
			},{
				type: 'separator'
			},{
				label:'备份所有笔记',
				click:createBackUp
			},{
				label:'从备份恢复',
				click:importBackUp
			}]
		},{
			label:'编辑',
			submenu:[{
				label: '撤销',
				accelerator: 'CommandOrControl+Z',
				selector: 'undo:'
			},{
				label: '重做',
				accelerator: 'CommandOrControl+Shift+Z',
				selector: 'redo:'
			},{
				type: 'separator'
			},{
				label: '全选',
				accelerator: 'CommandOrControl+A',
				selector: 'selectAll:'
			},{
				label:'剪切',
				accelerator:'CommandOrControl+X',
				selector:'cut:'
			},{
				label:'复制',
				accelerator:'CommandOrControl+C',
				selector:'copy:'
			},{
				label:'粘贴',
				accelerator:'CommandOrControl+V',
				selector:'paste:'
			},{
				type: 'separator'
			},{
				label:'查找',
				accelerator:'CommandOrControl+F',
				click:function(){
					switchSearch();
				}
			}]
		},{
			label:'视图',
			submenu:[{
				label:'切换列表',
				accelerator:'CommandOrControl+1',
				click:function(){
					view.switchVisible('sidebar');
				}
			},{
				label:'切换编辑',
				accelerator:'CommandOrControl+2',
				click:function(){
					view.switchVisible('editor');
				}
			},{
				label:'切换预览',
				accelerator:'CommandOrControl+3',
				click:function(){
					view.switchVisible('preview');
				}
			},{
				label:'新窗口打开',
				accelerator:'CommandOrControl+T',
				click:function(){
					view.openNoteInNewWindow(currentNote);
				}
			}]
		},{
			label:'云',
			submenu:[]
		}];
		if(options.isLogin){
			template[4].submenu[0] = {
				label:'退出登录',
				click:user.logout
			};
		}else{
			template[4].submenu[0] = {
				label:'登录',
				click:user.login
			};
		}
		return template;
	}

	// 初始化
	renderNoteList();
	// renderPreview();
	var $firstNoteIndex = document.querySelector('#noteList li a[data-id^="1"]');
	if($firstNoteIndex){
		$firstNoteIndex.click();
	}

	// 设置菜单
	buildAppMenu();

	// 微盘同步
	/*if(localStorage.getItem('syncVdisk') === 'true'){
		vdiskSync();
	}*/

})();



/*var observer = new MutationObserver(function(mutations){
	console.log(mutations);
});

observer.observe(document.querySelector('#editor'),{
	childList: true,
	characterData: true
});*/


