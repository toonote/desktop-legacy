exports.init = function(){
	var $editor = document.querySelector('#editor');
	$editor.addEventListener('keydown',function(e){
		var ctrlOrCmd = e.metaKey || e.ctrlKey;
		// CTRL+D，切换todo完成状态
		if(ctrlOrCmd && e.keyCode === 68){
			var selection = window.getSelection();
			var currNode = selection.focusNode;
			while(currNode.nodeName.toLowerCase() !== 'div' && currNode.parentNode){
				currNode = currNode.parentNode;
			}
			var currText = currNode.innerText.replace(/\xa0/g,' ');
			var todoItemRegExp = /\- \[([x ])\] ?/;
			var todoItemMatch = currText.match(todoItemRegExp);
			if(!todoItemMatch || todoItemMatch.length < 2) return;

			var range = selection.getRangeAt(0);
			var rangeOffset = range.startOffset;
			// console.log(range.startOffset);
			var isDone = todoItemMatch[1] === 'x';
			if(isDone){
				currNode.innerText = currText.replace('[x]','[ ]');
			}else{
				currNode.innerText = currText.replace('[ ]','[x]');
			}
			range.setStart(currNode.firstChild,rangeOffset);
			selection.removeAllRanges();
			selection.addRange(range);
			return;
		}
		// CTRL+I，插入新todo
		if(ctrlOrCmd && e.keyCode === 73){
			e.preventDefault();
			document.execCommand('insertHTML', false, '-&#32;[&#32;]&#32;');
			return;
		}
	});
};

exports.parseTodo = function(str){
	var todoItemRegExp = /\[([x ])\] ?/;
	var currText = str.replace(/\xa0/g,' ');
	var todoItemMatch = currText.match(todoItemRegExp);
	if(!todoItemMatch || todoItemMatch.length < 2) return currText;
	var isDone = todoItemMatch[1] === 'x';
	var checkBoxHtml = '<input type="checkbox" disabled /> ';
	if(isDone){
		checkBoxHtml = '<input type="checkbox" disabled checked /> ';
	}
	return currText.replace(todoItemRegExp,checkBoxHtml);
};