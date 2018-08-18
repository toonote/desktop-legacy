// @ts-check

export default {
	name: 'Version',
	primaryKey: 'id',
	properties: {
		id: 'string',
		message: 'string',
		createdAt: 'date',
		updatedAt: 'date',
		// 父级版本
		parentVersion: 'Version',
		// 为父级版本的反向链接，方便取到子级版本
		childVersion: {
			type: 'linkingObjects',
			objectType: 'Version',
			property: 'parentVersion',
		},
		notes: 'Note[]',
		categories: 'Category[]',
		notebooks: 'Notebook[]',
		changes: 'string'
	}
};
