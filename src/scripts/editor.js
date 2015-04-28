/*global ace*/
var init = function(){

	var editor = {};

	var aceEditor = ace.edit('editor');
	var session = aceEditor.getSession();
	window.test = aceEditor;
	aceEditor.commands.bindKey('Cmd-D', null);
	aceEditor.commands.bindKey('Ctrl-D', null);
	aceEditor.setTheme('ace/theme/tomorrow');
	aceEditor.$blockScrolling = Infinity;
	session.setMode('ace/mode/markdown');
	session.setUseWrapMode(true);
	aceEditor.renderer.setHScrollBarAlwaysVisible(false);
	aceEditor.renderer.setShowGutter(false);
	aceEditor.renderer.setPadding(10);

	editor.setContent = function(content){
		aceEditor.setValue(content, -1);
	};
	editor.getContent = aceEditor.getValue.bind(aceEditor);
	editor.focus = aceEditor.focus.bind(aceEditor);
	editor.resize = aceEditor.resize.bind(aceEditor);
	editor.getFirstVisibleRow = aceEditor.getFirstVisibleRow.bind(aceEditor);
	editor.session = session;
	editor.getRowText = function(row){
		if(typeof row === 'undefined'){
			row = aceEditor.getSelection().getCursor().row;
		}
		return session.getLine(row);
	};
	editor.replaceRowText = function(newText){
		var range = aceEditor.getSelectionRange();
		var position = aceEditor.getSelection().getCursor();
		var oldColumn = range.start.column;
		range.setStart({
			row:position.row,
			column:0
		});
		range.setEnd({
			row:position.row,
			column:999999999
		});
		session.replace(range, newText);

		/*range = aceEditor.getSelectionRange();
		range.setStart({
			row:position.row,
			column:oldColumn
		});
		range.setEnd({
			row:position.row,
			column:oldColumn
		});*/
	};
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