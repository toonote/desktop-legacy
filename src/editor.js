(function(){

	var noteIndex = JSON.parse(localStorage.getItem('noteIndex')||'{}');
	var currentNote = {};

	var $editor = document.querySelector('#editor');
	var saveTimer,saveInterval=5000;

	$editor.addEventListener('input',function(){

		if(!saveTimer){
			saveTimer = setTimeout(function(){
				updateNote(currentNote);
				updatePreview();
				saveTimer = 0;
			},saveInterval);
		}
		currentNote.content = $editor.innerText;
		var title = currentNote.content.split('\n',2)[0].replace(/^[# ]/g,'');
		updateNoteIndex(title);


	},false);

	/*// 定时保存
	setInterval(function(){
		updateNote(currentNote);
		updatePreview();
	},saveInterval);*/

	document.addEventListener('keydown',function(e){
		var ctrlOrCmd = e.metaKey || e.ctrlKey;
		if(!ctrlOrCmd) return;
		switch(e.keyCode){
			case 78:
				// N
				newNote();
				break;
			case 49:
				// 1
				switchVisible('sidebar');
				break;
			case 50:
				// 2
				switchVisible('editor');
				break;
			case 51:
				// 3
				switchVisible('preview');
				break;
		}
		return false;
	});

	function newNote(){
		var id = Date.now();
		var thisNoteIndex = {};
		thisNoteIndex[id] = 'Untitled';
		updateNoteIndex(thisNoteIndex);
		currentNote.id = id;
		currentNote.content = '';
		updateNote(currentNote);
		$editor.innerHTML = '';
		updateNoteList();
	}

	function updateNoteIndex(obj){
		if(typeof obj === 'string'){
			noteIndex[currentNote.id] = obj;
		}else{
			for(var id in obj){
				noteIndex[id] = obj[id];
			}
		}
		localStorage.setItem('noteIndex',JSON.stringify(noteIndex));
		updateNoteList();
	}

	function updateNote(obj){
		localStorage.setItem('note_'+obj.id,obj.content);
	}


	// 渲染笔记列表
	function updateNoteList(){
		var html = '';

		for(var id in noteIndex){
			html += '<li><a href="#" data-id="'+id.replace('note_','')+'">'+noteIndex[id]+'</a><i class="delete">X</i></li>';
		}

		document.querySelector('#noteList').innerHTML = html;
		if(!html){
			newNote();
		}
	}

	// 转换成markdown显示
	function updatePreview(){
		var marked = require('marked');
		var html = marked(currentNote.content);
		document.querySelector('#preview').innerHTML = html;
	}

	// 切换各栏显示状态
	function switchVisible(eleName){
		var $ele;
		switch(eleName){
			case 'sidebar':
				$ele = document.querySelector('#sidebar');
				break;
			case 'editor':
				$ele = $editor;
				break;
			case 'preview':
				$ele = document.querySelector('#preview');
				break;
		}
		if($ele.classList.contains('hide')){
			$ele.classList.remove('hide');
		}else{
			$ele.classList.add('hide');
		}
	}

	// HTML编码
	function htmlEncode(str){
		return str.replace(/</g,'&lt;')
				.replace(/ /g,'&nbsp;')
				.replace(/>/g,'&gt;')
				.replace(/"/g,'&quot;')
				.replace(/'/g,'&apos;')
				.replace(/\t/g,'&nbsp;&nbsp;&nbsp;&nbsp;');
	}

	// 获取当前笔记
	document.querySelector('#noteList').addEventListener('click',function(e){
		if(e.target.tagName !== 'A') return false;
		var id = e.target.dataset.id;
		currentNote.id = id;
		currentNote.content = localStorage.getItem('note_'+id);
		document.querySelector('#editor').innerHTML = htmlEncode(currentNote.content).split('\n').map(function(line){
			return '<div>' + (line||'<br />') + '</div>';
		}).join('');
		updatePreview();
	},false);

	// 删除当前笔记
	document.querySelector('#noteList').addEventListener('click',function(e){
		if(!e.target.classList.contains('delete')) return false;
		if(!confirm('确定要删除该笔记吗？')) return false;
		var id = e.target.parentNode.querySelector('a').dataset.id;
		delete noteIndex[id];
		localStorage.removeItem('note_'+id);
		updateNoteIndex();
		updateNoteList();
		document.querySelector('#noteList li a').click();
		updatePreview();
	},false);

	updateNoteList();
	document.querySelector('#noteList li a').click();
	updatePreview();

})();



/*var observer = new MutationObserver(function(mutations){
	console.log(mutations);
});

observer.observe(document.querySelector('#editor'),{
	childList: true,
	characterData: true
});*/

/*var selection = window.getSelection();
var range = selection.getRangeAt(0);

if(selection.archorNode.data.indexOf('# ') > -1){

}*/
