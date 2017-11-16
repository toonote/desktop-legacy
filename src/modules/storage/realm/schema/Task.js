// @ts-check

export default {
	name: 'Task',
	primaryKey: 'key',
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
