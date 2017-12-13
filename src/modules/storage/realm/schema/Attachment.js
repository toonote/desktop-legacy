// @ts-check

export default {
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
