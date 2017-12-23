// @ts-check

export default {
	name: 'Version',
	primaryKey: 'id',
	properties: {
		id: 'string',
		message: 'string',
		createdAt: 'date',
		updatedAt: 'date',
		notes: 'Note[]'
	}
};
