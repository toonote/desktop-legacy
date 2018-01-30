// @ts-check

export default {
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
