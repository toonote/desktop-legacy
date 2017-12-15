import Remarkable from 'remarkable';
import hljs from 'highlight.js';
import {getResults} from './storage/realm';
import {getFileExt} from './util/io';

let renderer = new Remarkable({
	highlight: function (str, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return hljs.highlight(lang, str).value;
			} catch (err) {}
		}

		try {
			return hljs.highlightAuto(str).value;
		} catch (err) {}

		return ''; // use external default escaping
	}
});


// 解析todo
let todoRegExp = /^\[([ x])\] ?([\s\S]*)/i;

renderer.use(function(md) {
	md.core.ruler.after('block', 'todo', function(state){
		var tokens = state.tokens;
		var len = tokens.length, i = -1;
		while(++i < len) {
			var token = tokens[i];
			// console.log(token);
			if (token.type === 'inline' && token.content) {
				token.content = token.content.replace(todoRegExp, (str, char, text) => {
					// console.log(str, char, text);
					let isDone = char.toLowerCase() === 'x';
					// return `<input type="checkbox" ${isDone?"checked":""} />` + text;
					return `${isDone ? '✓' : '☐'} ` + text;
				});
			}
		}
	}, {alt: []});
});

let index = 0;

let customerRulesMap = {
	paragraph: 'p',
	table: 'table',
	// list_item: 'li',
	// tr: 'tr',
};

for(let token in customerRulesMap){
	// console.log('[preview]',token);
	let tag = customerRulesMap[token];
	renderer.renderer.rules[`${token}_open`] = function (tokens, idx) {
		var line;
		if(tag === 'tr'){
			// console.log(tokens[idx]);
		}
		if (tokens[idx].lines/* && tokens[idx].level === 0*/) {
			line = tokens[idx].lines[0];
			return `<${tag} class="line" data-line="${line}">`;
		}
		return `<${tag}>`;
	};
}

renderer.renderer.rules.list_item_open = function (tokens, idx) {
	for(let i = idx + 1; i < idx + 3; i++){
		if(/[✓☐]/.test(tokens[i].content)){
			return `<li class="todo${/^✓/i.test(tokens[i].content) ? ' done' : ' doing'}">`;
		}
	}
	return '<li>';
};

renderer.renderer.rules.heading_open = function (tokens, idx) {
	var line;
	if (tokens[idx].lines && tokens[idx].level === 0) {
		line = tokens[idx].lines[0];
		return '<h' + tokens[idx].hLevel + ' class="line" data-line="' + line + '"><a name="anchor' + (index++) + '">';
	}
	return '<h' + tokens[idx].hLevel + '>';
};

renderer.renderer.rules.heading_close = function (tokens, idx) {
	return '</a></h' + tokens[idx].hLevel + '>';
};

const srcCache = {};
const getFileSize = function(size){
	if(size / 1024 < 1){
		return size + ' b';
	}else if(size / 1024 / 1024 < 1){
		return (size / 1024).toFixed(2) + ' k';
	}else if(size / 1024 / 1024 / 1024 < 1){
		return (size / 1024 / 1024).toFixed(2) + ' m';
	}else{
		return (size / 1024 / 1024 / 1024).toFixed(2) + ' g';
	}
};
// 将附件地址替换为本地地址
// 来自https://github.com/jonschlinkert/remarkable/blob/master/lib/rules.js#L170
renderer.renderer.rules.image = function (tokens, idx) {
	const originalSrc = tokens[idx].src;
	if(!srcCache[originalSrc]){
		const attachmentId = originalSrc.replace(/^tnattach:\/\//,'').replace(/\..+/g, '');
		const attachment = getResults('Attachment').filtered(`id="${attachmentId}"`);
		if(attachment[0]){
			srcCache[originalSrc] = {
				url: 'file://' + attachment[0].localPath,
				title: attachment[0].filename,
				ext: attachment[0].ext,
				size: attachment[0].size
			};
		}else{
			srcCache[originalSrc] = {
				title: '',
				url: originalSrc,
				ext: '',
				size: 0
			};
		}
	}
	const attachmentInfo = srcCache[originalSrc];
	const realSrc = attachmentInfo.url;
	const imageRegExp = /^\.(?:jpe?g|png|bmp|tiff|gif)$/;

	if(!attachmentInfo.ext || imageRegExp.test(attachmentInfo.ext)){
		// 如果是图片
		var src = ' src="' + realSrc + '"';
		var title = tokens[idx].title ? (' title="' + tokens[idx].title + '"') : '';
		var alt = ' alt="' + (tokens[idx].alt ? tokens[idx].alt : '') + '"';
		var suffix = ' /';
		return '<img' + src + alt + title + suffix + '>';
	}else{
		// 如果是附件
		const extIcon = attachmentInfo.ext.replace(/\./g, '');
		return `<div class="tn-attachment">
				<div class="tn-attachment-icon tn-attachment-icon-${extIcon}"></div>
				<div class="tn-attachment-info">
					<p class="tn-attachment-title">${attachmentInfo.title}</p>
					<p class="tn-attachment-size">${getFileSize(attachmentInfo.size)}</p>
				</div>
			</div>`;
	}
};

export default renderer;
