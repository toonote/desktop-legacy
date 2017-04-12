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
	let session = editor.getSession();
	let undo = session.getUndoManager();

	editor.commands.bindKey('Cmd-D', null);
	editor.commands.bindKey('Ctrl-D', null);
	editor.commands.bindKey('Ctrl-Z', null);
	editor.commands.bindKey('Cmd-Z', null);
	editor.commands.bindKey('Ctrl-Y', null);
	editor.commands.bindKey('Cmd-Y', null);


	let getCurrentLineText = () => {
		let row = editor.getSelection().getCursor().row;
		return session.getLine(row);
	};

	let replaceCurrentLineText = (newText) => {
		let range = editor.getSelectionRange();
		let position = aceEditor.getSelection().getCursor();
		let oldColumn = range.start.column;
		range.setStart({
			row:position.row,
			column:0
		});
		range.setEnd({
			row:position.row,
			column:999999999
		});
		session.replace(range, newText);
	};

	// 撤销
	editor.commands.addCommand({
		name: 'undo',
		bindKey: {
			win: 'Ctrl-z',
			mac: 'Cmd-z'
		},
		exec: function(editor) {
			if(undo.hasUndo()){
				undo.undo(true);
			}
		}
	});

	// 反撤销
	editor.commands.addCommand({
		name: 'redo',
		bindKey: {
			win: 'Ctrl-y',
			mac: 'Cmd-y'
		},
		exec: function(editor) {
			if(undo.hasRedo()){
				undo.redo(true);
			}
		}
	});

	// 选中整行
	editor.commands.addCommand({
		name: 'selectLine',
		bindKey: {
			win: 'Ctrl-l',
			mac: 'Cmd-l'
		},
		exec: function(editor) {
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
			mac: 'Cmd-Shift-l'
		},
		exec: function(editor) {
			selection.splitIntoLines();
		}
	});

	// 向下移动
	editor.commands.addCommand({
		name: 'moveDown',
		bindKey: {
			win: 'Ctrl-Shift-Down',
			mac: 'Cmd-Ctrl-Down'
		},
		exec: function(editor) {
			let isSelectionEmpty = selection.isEmpty();
			console.log(isSelectionEmpty);
			if(isSelectionEmpty){
				selection.selectLine();
			}
			editor.moveLinesDown();
			if(isSelectionEmpty){
				selection.clearSelection();
				selection.moveCursorUp();
			}else{
				// selection.moveCursorDown()
			}
		}
	});

	// 向上移动
	editor.commands.addCommand({
		name: 'moveUp',
		bindKey: {
			win: 'Ctrl-Shift-Up',
			mac: 'Cmd-Ctrl-Up'
		},
		exec: function(editor) {
			let isSelectionEmpty = selection.isEmpty();
			console.log(isSelectionEmpty);
			if(isSelectionEmpty){
				selection.selectLine();
			}
			editor.moveLinesUp();
			if(isSelectionEmpty){
				selection.clearSelection();
				selection.moveCursorUp();
			}else{
				// selection.moveCursorDown()
			}
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

	// TODO完成切换
	editor.commands.addCommand({
		name: 'toggleTodoState',
		bindKey: {
			win: 'Ctrl-d',
			mac: 'Cmd-d'
		},
		exec: function(editor) {
			let currText = getCurrentLineText();

			let todoItemRegExp = /\- \[([x ])\] ?/;
			let todoItemMatch = currText.match(todoItemRegExp);
			if(!todoItemMatch || todoItemMatch.length < 2) return;

			let newText;
			let isDone = todoItemMatch[1] === 'x';
			if(isDone){
				newText = currText.replace('[x]','[ ]').replace(/ \([\d\-: ]+\)\s*$/,'');
			}else{
				let date = new Date();
				let ts = date.getTime() - date.getTimezoneOffset() * 60 * 1000;
				let s = new Date(ts).toISOString();

				let now = s.replace(/T/g,' ').replace(/^\d{2}/, '').replace(/:\d+\.\d+Z$/,''); // 16-11-24 14:16
				newText = currText.replace('[ ]','[x]') + ` (${now})`;
			}

			replaceCurrentLineText(newText);

		}
	});

	// TODO任务切换
	editor.commands.addCommand({
		name: 'toggleIsTodo',
		bindKey: {
			win: 'Ctrl-i',
			mac: 'Cmd-i'
		},
		exec: function(editor) {
			let currText = getCurrentLineText();
			let newText;

			let todoItemRegExp = /\- \[([x ])\] ?/;
			let todoItemMatch = currText.match(todoItemRegExp);
			if(!todoItemMatch || todoItemMatch.length < 2){
				newText = '- [ ] ' + currText.replace(/^\- /,'');
			}else{
				newText = currText.replace(/^\- \[[x ]\] /,'- ');
			}

			replaceCurrentLineText(newText);

		}
	});

};


export default shortcut;


