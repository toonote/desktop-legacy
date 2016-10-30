import Zip from 'jszip';
let io = {};
let fs = require('fs');
let path = require('path');

io.getExt = (filename) => {
	return path.extname(filename);
};

io.getFileText = (filePath) => {
	filePath = path.join(require('electron').remote.app.getAppPath(), filePath);
	return fs.readFileSync(filePath, 'utf8');
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
io.selectFileContent = (filters) => {
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

// 选择写入路径
io.selectPathForWrite = (filters) => {
	var remote = require('electron').remote;
	var dialog = remote.dialog;
	var filePath = dialog.showSaveDialog({
		filters: filters,
		properties: ['createDirectory']
	});
	if(!filePath) return;

	return filePath;
};

// 从备份文件恢复
io.getNotesFromBackUp = async function(){
	let fileContent = io.selectFileContent([{
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

// 导出为各种格式文件
io.export = function(format, content){
	var filters = [];
	if(format === 'md'){
		filters.push({
			name: 'Markdown文件',
			extensions: ['md']
		});
	}else if(format === 'htmlBody' || format === 'htmlBodyWithCss' || format === 'html'){
		filters.push({
			name: 'HTML文件',
			extensions: ['html']
		});
	}else if(format === 'pdf'){
		filters.push({
			name: 'PDF文件',
			extensions: ['pdf']
		});
	}
	let filePath = io.selectPathForWrite(filters);
	let htmlTmpPath;

	if(format === 'pdf') {
		let cwd = path.dirname(filePath);
		// 如果是pdf，先生成一个临时HTML文件
		htmlTmpPath = path.join(cwd,'ToonotePdfTmp.html');
		fs.writeFileSync(htmlTmpPath, content, 'utf8');
		// 生成pdf
		let spawn = require('child_process').spawn;
		let pdfprocess = spawn(path.join(require('electron').remote.app.getAppPath(), 'lib/phantomjs'),[
			path.join(require('electron').remote.app.getAppPath(), 'lib/html2pdf.js'),
			encodeURI(htmlTmpPath),
			filePath
		],{
			cwd:cwd
		});
		pdfprocess.stdout.on('data',function(data){
			console.log('stdout'+data);
		});
		pdfprocess.stderr.on('data',function(data){
			console.log('stderr'+data);
		});
		pdfprocess.on('close',function(){
			console.log('closed');
			// 删除HTML文件
			fs.unlink(htmlTmpPath, function(){
				console.log('htm deleted');
			});
		});
	}else{
		fs.writeFileSync(filePath, content, 'utf8');
	}

}

/*// 创建备份文件
function createBackUp(){
	var filters = [{
		name: 'TooNote备份文件',
		extensions: ['tnt']
	}];
	var remote = require('remote');
	var dialog = remote.require('dialog');
	var filePath = dialog.showSaveDialog({
		filters: filters,
		properties: ['createDirectory']
	});
	if(!filePath) return;
	var zip = new require('jszip')();
	zip.file('index',JSON.stringify(noteIndex));
	for(var id in noteIndex){
		zip.file(id,JSON.stringify(localStorage.getItem('note_' + id)),{binary:false});
	}
	var data = zip.generate({base64:false,compression:'DEFLATE'});
	var fs = require('fs');
	fs.writeFile(filePath,data,'binary',function(err,result){
		if(!err){
			console.log('tnt create successed.');
		}else{
			console.log('tnt create fail.' + err.message);
		}
	});
}*/

export default io;
