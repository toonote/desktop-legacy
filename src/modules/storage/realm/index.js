// @ts-check
/* global TEST */
import path from 'path';
import Realm from 'realm';
import ConfigSchema from './schema/Config';
import NotebookSchema from './schema/Notebook';
import CategorySchema from './schema/Category';
import NoteSchema from './schema/Note';
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

export async function init(){
	await Realm.open({
		schema: [ConfigSchema, NotebookSchema, CategorySchema, NoteSchema],
		schemaVersion: SCHEMA_VERSION,
		path: DB_PATH
	}).then((realmInstance) => {
		realm = realmInstance;
	});
}
