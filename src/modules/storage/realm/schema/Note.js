// @ts-check

export default {
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
