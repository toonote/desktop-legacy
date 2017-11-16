// @ts-check

export default {
	name: 'Notebook',
	primaryKey: 'id',
	properties: {
		id: 'string',
		title: 'string',
		order: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		categories: 'Category[]',
		notes: 'Note[]'
	}
};
