import io from './io';
import renderer from '../renderer';
import inlineCss from 'inline-css';

/**
 * 高级渲染（获取带样式的html）
 * 如果options.isFullHtml === false && options.inlineCss === false
 * 则不会有样式
 * @param {string} md Markdown文本
 * @param {Object} [options] 选项
 * @param {boolean} [options.withBasicCss] 附加基本的CSS
 * @param {string[]} [options.cssList] 要附加的自定义CSS选项
 * @param {boolean} [options.isFullHtml] 是否导出完整的HTML
 * @param {boolean} [options.inlineCss] 是否要将CSS作为inline样式附加
 * @param {string} [options.title] 导出HTML文件的标题
 * @returns {string} 渲染后的HTML
 */
export async function customRender(md, options = {}){
	let cssList = options.cssList;
	if(!cssList) cssList = [];
	let content = basicRender(md);

	if(options.withBasicCss){
		cssList.unshift('/node_modules/highlight.js/styles/tomorrow.css');
		cssList.unshift('/style/htmlbody.css');
	}

	let cssText = '';
	cssList.forEach((cssPath) => {
		cssText += io.getFileText(cssPath);
	});

	if(options.inlineCss){
		// 如果要内联CSS，就加上body内联
		content = await inlineCss(`<body class="htmlBody">${content}</body>`, {
			url: '/',
			extraCss: cssText
		});
	}else if(options.withBasicCss){
		// 如果不用内联CSS，则看是否需要基本样式
		// 如果需要，则套上body
		content = `<body class="htmlBody">${content}</body>`;
	}else if(options.isFullHtml){
		// 如果不需要，则看是否要HTML全文
		content = `<body class="htmlBody">${content}</body>`;
	}

	if(options.isFullHtml){
		content = '<!doctype html><html>\n' +
			'<head>\n' +
			'<meta charset="utf-8">\n' +
			'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
			'<meta name="author" content="TooNote">\n' +
			'<title>' + (options.title || 'TooNote文档') + '</title>\n' +
			(options.inlineCss ? '' : ('<style>\n' + cssText + '</style>\n')) +
			'</head>\n' +
			content + '\n' +
			'</html>';
	}

	return content;
}

// 基本渲染
export function basicRender(md){
	return renderer.render(md);
}
