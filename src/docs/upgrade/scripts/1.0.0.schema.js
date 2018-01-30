

exports.Attachment =  {
	name: 'Attachment',
	primaryKey: 'id',
	properties: {
		id: 'string',
		filename: 'string',
		ext: 'string',
		size: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		localPath: 'string',
		remotePath: 'string',
		note: {
			type: 'linkingObjects',
			objectType: 'Note',
			property: 'attachments'
		}
	}
};



exports.Category =  {
	name: 'Category',
	primaryKey: 'id',
	properties: {
		id: 'string',
		title: 'string',
		order: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		notes: 'Note[]',
		versions: {
			type: 'linkingObjects',
			objectType: 'Version',
			property: 'categories'
		},
		notebook: {
			type: 'linkingObjects',
			objectType: 'Notebook',
			property: 'categories'
		}
	}
};



exports.Config =  {
	name: 'Config',
	primaryKey: 'key',
	properties: {
		key: 'string',
		value: 'string'
	}
};



exports.Note =  {
	name: 'Note',
	primaryKey: 'id',
	properties: {
		id: 'string',
		title: 'string',
		content: 'string',
		order: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		localVersion: 'int',
		remoteVersion: 'int',
		attachments: 'Attachment[]',
		versions: {
			type: 'linkingObjects',
			objectType: 'Version',
			property: 'notes'
		},
		category: {
			type: 'linkingObjects',
			objectType: 'Category',
			property: 'notes'
		},
		notebook: {
			type: 'linkingObjects',
			objectType: 'Notebook',
			property: 'notes'
		}
	}
};



exports.Notebook =  {
	name: 'Notebook',
	primaryKey: 'id',
	properties: {
		id: 'string',
		title: 'string',
		order: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		categories: 'Category[]',
		notes: 'Note[]',
		versions: {
			type: 'linkingObjects',
			objectType: 'Version',
			property: 'notebooks'
		}
	}
};



exports.Task =  {
	name: 'Task',
	primaryKey: 'id',
	properties: {
		id: 'string',
		type: 'string',
		priority: 'int',
		targetId: 'string',
		data: 'string',
		status: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		log: 'string[]',
	}
};



exports.Version =  {
	name: 'Version',
	primaryKey: 'id',
	properties: {
		id: 'string',
		message: 'string',
		createdAt: 'date',
		updatedAt: 'date',
		notes: 'Note[]',
		categories: 'Category[]',
		notebooks: 'Notebook[]',
		changes: 'string'
	}
};



exports.VersionNoteContent =  {
	name: 'VersionNoteContent',
	primaryKey: 'id',
	properties: {
		id: 'string',
		noteId: 'string',
		versionId: 'string',
		content: 'string',
		createdAt: 'date',
		updatedAt: 'date',
	}
};
