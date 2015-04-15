/*global ace*/
var init = function(){

	var editor = {};

	var aceEditor = ace.edit('editor');
	var session = aceEditor.getSession();
	aceEditor.setTheme('ace/theme/tomorrow');
	aceEditor.$blockScrolling = Infinity;
	session.setMode('ace/mode/markdown');
	session.setUseWrapMode(true);
	aceEditor.renderer.setHScrollBarAlwaysVisible(false);
	aceEditor.renderer.setShowGutter(false);
	aceEditor.renderer.setPadding(10);
	/*aceEditor.on('mousemove',function(e){
		console.log(e);
		editor.position = e.getDocumentPosition();
	});*/
	console.log('hello?');
	editor.setContent = function(content){
		aceEditor.setValue(content, -1);
	};
	editor.getContent = aceEditor.getValue.bind(aceEditor);
	editor.focus = aceEditor.focus.bind(aceEditor);
	editor.resize = aceEditor.resize.bind(aceEditor);
	editor.getRowText = session.getLine.bind(session);
	editor.setCursor = function(row, col){
		aceEditor.getSelection().moveCursorTo(row, col);
	};
	editor.setCursorToLineEnd = function(){
		aceEditor.getSelection().moveCursorLineEnd();
	};
	editor.insertText = function(text){
		aceEditor.insert(text);
	};


	var isGutterOn = false;
	editor.switchGutter = function(){
		isGutterOn = !isGutterOn;
		aceEditor.renderer.setShowGutter(isGutterOn);
	};

	return editor;

};

module.exports = init();