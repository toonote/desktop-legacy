let io = {};
// 从备份文件恢复
io.importBackUp = () => {
	var remote = require('electron').remote;
	var dialog = remote.dialog;
	var filePath = dialog.showOpenDialog({
		filters: [{
			name: 'TooNote备份文件',
			extensions: ['tnt']
		}],
		properties: ['openFile']
	});
	if(!filePath || !filePath.length) return;
	filePath = filePath[0];

	var fs = require('fs');
	fs.readFile(filePath,'binary',function(err,fileContent){
		if(err){
			alert('打开文件出错：\n'+err.message);
			return;
		}else{
			var zip = new require('jszip')();
			zip.load(fileContent);
			var zipNoteIndex = JSON.parse(zip.files.index.asText() || '{}');
			if(!confirm('备份文件含有'+Object.keys(zipNoteIndex).length+'条笔记，如确认导入将覆盖当前所有笔记，请您再次确认是否要清除当前笔记并导入备份文件？')) return;
			noteIndex = zipNoteIndex;
			updateNoteIndex(zipNoteIndex);
			for(var id in noteIndex){
				updateNote({
					id:id,
					content:JSON.parse(zip.files[id].asText())
				});
			}
			var $firstNoteIndex = document.querySelector('#noteList li a[data-id^="1"]');
			if($firstNoteIndex){
				$firstNoteIndex.click();
			}
		}
	});
}
export default io;
