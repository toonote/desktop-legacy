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
	/*aceEditor.on('mousemove',function(e){
		console.log(e);
		editor.position = e.getDocumentPosition();
	});*/
	console.log('hello?');
	editor.setContent = function(content){
		aceEditor.setValue(content, -1);
	};
	editor.getContent = aceEditor.getValue.bind(aceEditor);
	editor.resize = aceEditor.resize.bind(aceEditor);
	editor.setCursor = function(row, col){
		aceEditor.getSelection().moveCursorTo(row, col);
	};
	editor.getRowText = session.getLine.bind(session);
	editor.insertText = function(text){
		aceEditor.insert(text);
	};
	// moveCursorLineEnd

	var isGutterOn = false;
	editor.switchGutter = function(){
		isGutterOn = !isGutterOn;
		aceEditor.renderer.setShowGutter(isGutterOn);
	};

	return editor;

};

module.exports = init();