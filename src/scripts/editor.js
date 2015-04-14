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
	console.log('hello?');
	editor.setContent = function(content){
		aceEditor.setValue(content, -1);
	};
	editor.getContent = aceEditor.getValue.bind(aceEditor);
	editor.resize = aceEditor.resize.bind(aceEditor);

	var isGutterOn = false;
	editor.switchGutter = function(){
		isGutterOn = !isGutterOn;
		aceEditor.renderer.setShowGutter(isGutterOn);
	};

	return editor;

};

module.exports = init();