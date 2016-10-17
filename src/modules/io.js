import Zip from 'jszip';
let io = {};
let fs = require('fs');
let path = require('path');

io.getExt = (filename) => {
	return path.extname(filename);
};

io.saveFile = (data, ext) => {
	let userDataPath = require('electron').remote.app.getPath('userData');
	let savePath = path.join(userDataPath, 'images');
	let saveFilePath = path.join(savePath, (Date.now() + '' + Math.random()).replace('.',''));
	if(ext){
		saveFilePath += ext;
	}

	if(!fs.existsSync(savePath)){
		fs.mkdirSync(savePath);
	}

	try{
		fs.writeFileSync(saveFilePath, data, 'binary');
	}catch(e){
		console.log('saveFile Error', e);
		return false;
	}
	return saveFilePath;
};

io.saveImageFromClipboard = () => {
	let img = require('electron').clipboard.readImage();
	let imgData = img.toPng();

	return io.saveFile(imgData, '.png');
};

io.saveImage = (imagePath, ext) => {

	let data = fs.readFileSync(imagePath);
	return io.saveFile(data, ext);
};


// 选择文件
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
