import * as mdRender from  '../util/mdRender';
import io from '../util/io';

export default async function(format, noteTitle, noteContent){
	let content = '';
	switch(format){
		case 'md':
			content = noteContent;
			break;
		case 'htmlContent':
			content = mdRender.basicRender(noteContent);
			break;
		case 'htmlBodyWithCss':
			content = await mdRender.customRender(noteContent, {
				withBasicCss: true,
				inlineCss: true
			});
			break;
		case 'html':
		case 'pdf':
			let cssList = [];
			if(format === 'pdf'){
				cssList.push('/style/pdf.css');
			}
			content = await mdRender.customRender(noteContent, {
				title: noteTitle,
				withBasicCss: true,
				cssList,
				isFullHtml: true
			});
			break;
	}
	io.export(format, content, noteTitle);
}
