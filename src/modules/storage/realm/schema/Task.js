// @ts-check

export default {
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
