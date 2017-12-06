import io from './io';
import renderer from '../renderer';
import inlineCss from 'inline-css';

// 获取带样式的html
export default async function(md, cssList = []){
	let content = renderer.render(md);
	let cssText = io.getFileText('/style/htmlbody.css');
	cssText += io.getFileText('/node_modules/highlight.js/styles/tomorrow.css');
	cssList.forEach((cssPath) => {
		cssText += io.getFileText(cssPath);
	});
	content = await inlineCss(`<body class="htmlBody">${content}</body>`, {
		url: '/',
		extraCss: cssText
	});
	return content;
}
