import Remarkable from 'remarkable';
import hljs from 'highlight.js';

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

let index = 0;

let customerRulesMap = {
	paragraph: 'p',
	table: 'table',
	// list_item: 'li',
	// tr: 'tr',
};

for(let token in customerRulesMap){
	console.log('[preview]',token);
	let tag = customerRulesMap[token];
	renderer.renderer.rules[`${token}_open`] = function (tokens, idx) {
		var line;
		if(tag === 'tr'){
			console.log(tokens[idx]);
		}
		if (tokens[idx].lines/* && tokens[idx].level === 0*/) {
			line = tokens[idx].lines[0];
			return `<${tag} class="line" data-line="${line}">`;
		}
		return `<${tag}>`;
	};
}

renderer.renderer.rules.heading_open = function (tokens, idx) {
	var line;
	if (tokens[idx].lines && tokens[idx].level === 0) {
		line = tokens[idx].lines[0];
		return '<h' + tokens[idx].hLevel + ' class="line" data-line="' + line + '"><a name="anchor'+(index++)+'">';
	}
	return '<h' + tokens[idx].hLevel + '>';
};

renderer.renderer.rules.heading_close = function (tokens, idx) {
	return '</a></h'+ tokens[idx].hLevel + '>';
};

export default renderer;
