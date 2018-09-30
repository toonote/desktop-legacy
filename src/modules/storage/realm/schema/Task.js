// @ts-check

export default {
	name: 'Task',
	primaryKey: 'id',
	properties: {
		id: 'string',
		type: 'string',
		priority: 'int',
		data: 'string',
		status: 'int',
		createdAt: 'date',
		updatedAt: 'date',
		log: 'string[]',
	}
};
