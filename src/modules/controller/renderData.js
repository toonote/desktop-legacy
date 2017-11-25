export function update(source, dest){
	dest.notebookList = source.Notebook.map((notebook) => {
		console.log(notebook);
		return {
			id: notebook.id,
			title: notebook.title,
			order: notebook.order,
			createdAt: notebook.createdAt,
			updatedAt: notebook.updatedAt,
			// categories: notebook.categories,
			// notes: notebook.notes
		};
	});
	return dest;
}
