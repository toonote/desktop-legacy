// @ts-check

export default {
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
