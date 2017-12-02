// 以Schema + ID为key缓存普通对象
// 有这个对象后可以实现不同对象之间的循环引用
let cache = {};

// 将realm Results转换成普通数组和对象
const mapNotebook = function(source, isDeep = false, forceNoArray = false){
	let isArray = true;
	if(!source.map || forceNoArray){
		isArray = false;
	}
	if(!source.map){
		source = [source];
	}
	let ret = source.map((notebook) => {
		// console.log(notebook);
		const cacheKey = 'NOTEBOOK' + notebook.id;
		if(cache[cacheKey]) return cache[cacheKey];

		let ret = {
			id: notebook.id,
			title: notebook.title,
			order: notebook.order,
			createdAt: notebook.createdAt,
			updatedAt: notebook.updatedAt,
			// categories: notebook.categories,
			// notes: notebook.notes
		};
		if(isDeep){
			cache[cacheKey] = ret;
			ret.categories = mapCategory(notebook.categories, true);
			ret.notes = mapNote(notebook.notes, true);
		}
		return ret;
	});
	if(isArray){
		return ret;
	}else{
		return ret[0];
	}
};

// 将realm Results转换成普通数组和对象
const mapCategory = function(source, isDeep = false, forceNoArray = false){
	let isArray = true;
	if(!source.map || forceNoArray){
		isArray = false;
	}
	if(!source.map){
		source = [source];
	}
	let ret = source.map((category) => {
		// console.log(category);
		const cacheKey = 'CATEGORY' + category.id;
		if(cache[cacheKey]) return cache[cacheKey];
		let ret = {
			id: category.id,
			title: category.title,
			order: category.order,
			createdAt: category.createdAt,
			updatedAt: category.updatedAt,
			// notes: 'Note[]',
			/* notebook: {
				type: 'linkingObjects',
				objectType: 'Notebook',
				property: 'categories'
			} */
		};
		if(isDeep){
			cache[cacheKey] = ret;
			ret.notes = mapNote(category.notes, true);
			ret.notebook = mapNotebook(category.notebook, true, true);
		}
		return ret;
	});
	if(isArray){
		return ret;
	}else{
		return ret[0];
	}
};

// 将realm Results转换成普通数组和对象
const mapNote = function(source, isDeep = false, forceNoArray = false){
	let isArray = true;
	if(!source.map || forceNoArray){
		isArray = false;
	}
	if(!source.map){
		source = [source];
	}
	let ret = source.map((note) => {
		// console.log(note);
		const cacheKey = 'NOTE' + note.id;
		if(cache[cacheKey]) return cache[cacheKey];
		let ret = {
			id: note.id,
			title: note.title,
			order: note.order,
			createdAt: note.createdAt,
			updatedAt: note.updatedAt,
			localVersion: note.localVersion,
			remoteVersion: note.remoteVersion,
			/* category: {
				type: 'linkingObjects',
				objectType: 'Category',
				property: 'notes'
			},
			notebook: {
				type: 'linkingObjects',
				objectType: 'Notebook',
				property: 'notes'
			} */
		};
		if(isDeep){
			cache[cacheKey] = ret;
			ret.category = mapCategory(note.category, true, true);
			ret.notebook = mapNotebook(note.notebook, true, true);
		}
		return ret;
	});
	if(isArray){
		return ret;
	}else{
		return ret[0];
	}
};


// 将realm Results转换成普通数组和对象
/* const mapNoteWithContent = function(source){
	const ret = mapNote(source);
	return {
		...ret,
		content: source.content
	};
}; */

export function update(source, dest){
	cache = {};
	dest.notebookList.data = mapNotebook(source.Notebook, true);
	let currentNotebookId = dest.currentNotebook.data.id;
	if(currentNotebookId){
		switchCurrentNotebook(source, dest, currentNotebookId);
	}
	return dest;
}

export function switchCurrentNotebook(source, dest, notebookId){
	// const targetNoteobookResult = source.Notebook.filtered(`id="${notebookId}"`);
	// dest.currentNotebook.data = mapNotebook(targetNoteobookResult[0], true);
	dest.currentNotebook.data = dest.notebookList.data.filter((notebook) => {
		return notebook.id === notebookId;
	})[0];
}

export function switchCurrentNote(source, dest, noteId){
	dest.notebookList.data.forEach((notebook) => {
		notebook.notes.forEach((note) => {
			if(note.id === noteId){
				dest.currentNote.data = note;
				dest.currentNoteContent.data = source.Note.filtered(`id="${noteId}"`)[0].content;
			}
		});
	});
}

export function updateCurrentNote(dest, data){
	if(data.content){
		dest.currentNoteContent.data = data.content;
	}
	for(let key in data){
		if(key !== 'content'){
			dest.currentNote.data[key] = data[key];
		}
	}
}
