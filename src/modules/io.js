import Zip from 'jszip';
let io = {};

io.selectFile = (filters) => {
	var remote = require('electron').remote;
	var dialog = remote.dialog;
	var filePath = dialog.showOpenDialog({
		filters,
		properties: ['openFile']
	});

	if(!filePath || !filePath.length) return;
	filePath = filePath[0];

	var fs = require('fs');
	return fs.readFileSync(filePath,'binary');
};

// 从备份文件恢复
io.getNotesFromBackUp = async function(){
	let fileContent = io.selectFile([{
		name: 'TooNote备份文件',
		extensions: ['tnt']
	}]);
	let zip = await Zip.loadAsync(fileContent);
	let indexFile = await zip.file('index').async('string');
	let zipNoteIndex = JSON.parse(indexFile || '{}');

	let newNotes = [];
	for(let id in zipNoteIndex){
		let content = await zip.file(id).async('string');
		newNotes.push({
			id:id,
			title:zipNoteIndex[id],
			content:JSON.parse(content)
		});
	}
	return newNotes;
}
export default io;
