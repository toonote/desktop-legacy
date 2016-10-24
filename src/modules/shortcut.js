// https://github.com/ajaxorg/ace/issues/1287
/*{
	// "Alt-Left": "goSubwordLeft",
	// "Alt-Right": "goSubwordRight",
	// "Ctrl-Up": "scrollLineUp",
	// "Ctrl-Down": "scrollLineDown",
	"Shift-Ctrl-L": "splitSelectionByLine",
	"Shift-Tab": "indentLess",
	"Esc": "singleSelectionTop",
	"Cmd-L": "expandtoline",
	"Shift-Ctrl-K": "deleteLine",
	"Cmd-Enter": "insertLineAfter",
	"Shift-Cmd-Enter": "insertLineBefore",
	"Cmd-D": "selectNextOccurrence",
	// "Shift-Ctrl-Space": "selectScope",
	"Shift-Ctrl-M": "selectBetweenBrackets",
	"Ctrl-M": "goToBracket",
	"Cmd-Ctrl-Up": "swapLineUp",
	"Cmd-Ctrl-Down": "swapLineDown",
	"Ctrl-/": "toggleComment",
	"Ctrl-J": "joinLines",
	"Shift-Cmd-D": "duplicateLine",
	"Ctrl-T": "transposeChars",
	// "F9": "sortLines",
	// "Ctrl-F9": "sortLinesInsensitive",
	"F2": "nextBookmark",
	"Shift-F2": "prevBookmark",
	"Cmd-F2": "toggleBookmark",
	"Shift-Cmd-F2": "clearBookmarks",
	// "Alt-F2": "selectBookmarks",
	// "Alt-Q": "wrapLines",
	"Cmd-K Cmd-Backspace": "delLineLeft",
	"Cmd-K Cmd-K": "delLineRight",
	"Cmd-K Cmd-U": "upcaseAtCursor",
	"Cmd-K Cmd-L": "downcaseAtCursor",
	// "Cmd-K Cmd-Space": "setSublimeMark",
	// "Cmd-K Cmd-A": "selectToSublimeMark",
	// "Cmd-K Cmd-W": "deleteToSublimeMark",
	// "Cmd-K Cmd-X": "swapWithSublimeMark",
	// "Cmd-K Cmd-Y": "sublimeYank",
	// "Cmd-K Cmd-G": "clearBookmarks",
	// "Cmd-K Cmd-C": "showInCenter",
	"Shift-Alt-Up": "selectLinesUpward",
	"Shift-Alt-Down": "selectLinesDownward",
	// "Ctrl-F3": "findUnder",
	// "Shift-Ctrl-F3": "findUnderPrevious",
	// "Shift-Ctrl-[": "fold",
	// "Shift-Ctrl-]": "unfold",
	"Ctrl-K Ctrl-j": "unfoldAll",
	"Ctrl-K Ctrl-0": "unfoldAll",
	// "Ctrl-H": "replace",
}*/
let shortcut = function(aceEditor){
	let editor = aceEditor;
	let selection = editor.getSelection();
	// 选中整行
	editor.commands.addCommand({
		name: 'selectLine',
		bindKey: {
			win: 'Ctrl-l',
			mac: 'Command-l'
		},
		exec: function(editor) {
			console.log('cmd + l', );
			if(selection.isMultiLine()){
				// 如果已经选中一行了，则选下一行
				selection.selectDown();
			}else{
				// 否则，选中当前行
				selection.selectLine();
			}
		}
	});

	// 选中整行
	editor.commands.addCommand({
		name: 'splitInfoLines',
		bindKey: {
			win: 'Ctrl-Shift-l',
			mac: 'Command-Shift-l'
		},
		exec: function(editor) {
			console.log('cmd + shift + l', );
			selection.splitIntoLines();
		}
	});

	// 向下移动
	editor.commands.addCommand({
		name: 'moveDown',
		bindKey: {
			win: 'Ctrl-Shift-Down',
			mac: 'Command-Ctrl-Down'
		},
		exec: function(editor) {
			if(selection.isEmpty()){
				selection.selectLine();
			}
			editor.moveLinesDown();
			selection.clearSelection();
			selection.moveCursorUp()
		}
	});

	// 向上移动
	editor.commands.addCommand({
		name: 'moveUp',
		bindKey: {
			win: 'Ctrl-Shift-Up',
			mac: 'Command-Ctrl-Up'
		},
		exec: function(editor) {
			if(selection.isEmpty()){
				selection.selectLine();
			}
			editor.moveLinesUp();
			selection.clearSelection();
			selection.moveCursorUp()
		}
	});

	// 删除行
	editor.commands.addCommand({
		name: 'deleteLines',
		bindKey: {
			win: 'Ctrl-Shift-k',
			mac: 'Ctrl-Shift-k'
		},
		exec: function(editor) {
			editor.removeLines();
		}
	});

	// 删除到行尾
	editor.commands.addCommand({
		name: 'deleteToEnd',
		bindKey: {
			win: 'Ctrl-k Ctrl-k',
			mac: 'Cmd-k Cmd-k'
		},
		exec: function(editor) {
			editor.removeToLineEnd();
		}
	});

	// 删除到行首
	editor.commands.addCommand({
		name: 'deleteToStart',
		bindKey: {
			win: 'Ctrl-k Ctrl-backspace',
			mac: 'Cmd-k Cmd-backspace'
		},
		exec: function(editor) {
			editor.removeToLineStart();
		}
	});

};


export default shortcut;


