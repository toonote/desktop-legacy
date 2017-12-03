// @ts-check
/* global TEST */
import path from 'path';
import Realm from 'realm';
import ConfigSchema from './schema/Config';
import NotebookSchema from './schema/Notebook';
import CategorySchema from './schema/Category';
import NoteSchema from './schema/Note';
import idGen from '../../util/idGen';
import io from '../../util/io';
const SCHEMA_VERSION = 1;

let filename = 'toonote.realm';
if(TEST){
	filename = 'toonote.test.realm';
}
if(DEBUG){
	filename = 'toonote.debug.realm';
}
const DB_PATH = path.join(require('electron').remote.app.getPath('userData'), filename);

let realm;

let _isInWrite = false;
/**
 * 确保处在realm.write回调函数中
 * @param {function} cb 回调函数
 */
function ensureWrite(cb){
	if(!_isInWrite){
		_isInWrite = true;
		realm.write(cb);
		_isInWrite = false;
	}else{
		cb();
	}
}

/**
 * 初始化数据
 * 如果没有数据，则新建一些默认数据
 */
function initData(){
	console.time('initData');
	// 新建第一个笔记本
	const notebookList = getResults('Notebook');
	if(!notebookList.length){
		const now = new Date();
		const note = {
			id: idGen(),
			title: '快速入门',
			content: io.getFileText('docs/welcome.md'),
			order: 1,
			createdAt: now,
			updatedAt: now,
			localVersion: 1,
			remoteVersion: 0,
		};

		const category = {
			id: idGen(),
			title: '默认分类',
			order: 1,
			createdAt: now,
			updatedAt: now,
			notes: [note],
		};

		const notebook = {
			id: idGen(),
			title: '默认笔记',
			order: 1,
			createdAt: now,
			updatedAt: now,
			categories: [category],
			notes: [note]
		};

		note.category = category;
		note.notebook = notebook;
		category.notebook = notebook;

		updateResult('Notebook', notebook);
	}
	console.timeEnd('initData');
}

/**
 * 初始化realm数据库
 */
export function init(){
	console.time('openRealm');
	realm = new Realm({
		schema: [ConfigSchema, NotebookSchema, CategorySchema, NoteSchema],
		schemaVersion: SCHEMA_VERSION,
		path: DB_PATH
	});
	console.timeEnd('openRealm');
	// 初始化数据
	initData();
}

/**
 * 获取某个Schema的结果
 * @param {string} name Schema名称
 * @returns {Realm.Results} Schema结果
 */
export function getResults(name){
	return realm.objects(name);
}

/**
 * 更新数据
 * @param {string} name Schema名称
 * @param {Object|Array<Object>} arr 新数据
 */
export function updateResult(name, arr){
	ensureWrite(() => {
		if(!Array.isArray(arr)) arr = [arr];
		arr.forEach((obj) => {
			// 当主键相同时，第三个参数会覆盖已有记录
			realm.create(name, obj, true);
		});
	});
}

/**
 * 插入数据
 * @param {string} name Schema名称
 * @param {Object} obj 新数据
 * @param {Object[]} reverseLinkArr 需要处理的反向链接信息
 * @returns {string} 新数据的ID
 */
export function createResult(name, obj, reverseLinkArr = []){
	if(!obj.id){
		obj.id = idGen();
	}

	ensureWrite(() => {
		const newObj = realm.create(name, obj, true);
		// 处理反向链接
		// [{
		//	   name: 'Category',
		//     id: '123456',
		//     field: 'notes',
		// }]
		createReverseLink(newObj, reverseLinkArr);
	});

	return obj.id;
}

/**
 * 删除数据
 * @param {string} name Schema名称
 * @param {string} id 数据ID
 */
export function deleteResult(name, id){
	const target = getResults(name).filtered(`id="${id}"`)[0];
	ensureWrite(() => {
		if(target){
			realm.delete(target);
		}
	});
}

/**
 * 为result创建反向链接
 * @param {Realm.Results | string} result realm对象
 * @param {Object[]} reverseLinkArr 需要处理的反向链接信息
 */
export function createReverseLink(result, reverseLinkArr){
	ensureWrite(() => {
		reverseLinkArr.forEach((linkInfo) => {
			return getResults(linkInfo.name).filtered(`id="${linkInfo.id}"`)[0][linkInfo.field].push(result);
		});
	});
}

/**
 * 为result移除反向链接
 * @param {Realm.Results | string} result realm对象
 * @param {Object[]} reverseLinkArr 需要处理的反向链接信息
 */
export function removeReverseLink(result, reverseLinkArr){
	ensureWrite(() => {
		reverseLinkArr.forEach((linkInfo) => {
			const targetField = getResults(linkInfo.name).filtered(`id="${linkInfo.id}"`)[0][linkInfo.field];
			const index = targetField.indexOf(result);
			if(index > -1){
				targetField.splice(index, 1);
			}
		});
	});
}
