import Remarkable from 'remarkable';
import hljs from 'highlight.js';
import mermaid from 'mermaid';

let renderer = new Remarkable({
	highlight: function(str, lang) {
		console.log(str);
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
	md.core.ruler.after('block', 'todo', function(state) {
		var tokens = state.tokens;
		var len = tokens.length,
			i = -1;
		while (++i < len) {
			var token = tokens[i];
			// console.log(token);
			if (token.type === 'inline' && token.content) {
				token.content = token.content.replace(todoRegExp, (str, char, text) => {
					// console.log(str, char, text);
					let isDone = char.toLowerCase() === 'x';
					// return `<input type="checkbox" ${isDone?"checked":""} />` + text;
					return `${isDone ? '✓':'☐'} ` + text;
				});
			}
		}
	}, {
		alt: []
	});
});

let index = 0;

let customerRulesMap = {
	paragraph: 'p',
	table: 'table',
	// list_item: 'li',
	// tr: 'tr',
};

for (let token in customerRulesMap) {
	// console.log('[preview]',token);
	let tag = customerRulesMap[token];
	renderer.renderer.rules[`${token}_open`] = function(tokens, idx) {
		var line;
		if (tag === 'tr') {
			// console.log(tokens[idx]);
		}
		if (tokens[idx].lines /* && tokens[idx].level === 0*/ ) {
			line = tokens[idx].lines[0];
			return `<${tag} class="line" data-line="${line}">`;
		}
		return `<${tag}>`;
	};
}
renderer.renderer.rules.fence_custom = {
	mermaid:function(tokens, idx, options, env, instance){
		let token = tokens[idx];
		let flowStr = token.content;
		try {
			let $div = document.getElementById('mermaidContainer');
			if (!$div) {
				$div = document.createElement('div');
				$div.id = 'mermaidContainer';
				$div.style = 'height:0;overflow:hidden;';
				// mermaid中的flow类取的容器是文档中的第一个符合条件的容器，所以需要将div容器放在body最前面
				document.body.insertBefore($div, document.body.firstChild);
				console.log('添加了新div');
			}
			let svgStr = mermaid.render('mermaid' + idx, flowStr, function(svgGraph) {
			},$div);
			return '<div>' + svgStr + '</div>';
		} catch (err) {
			token.params = '';
			return instance.rules.fence(tokens, idx, options, env, instance);
		}
	}
};
renderer.renderer.rules.list_item_open = function(tokens, idx) {
	for (let i = idx + 1; i < idx + 3; i++) {
		if (/[✓☐]/.test(tokens[i].content)) {
			return `<li class="todo${/^✓/i.test(tokens[i].content) ? ' done':' doing'}">`;
		}
	}
	return '<li>';
};

renderer.renderer.rules.heading_open = function(tokens, idx) {
	var line;
	if (tokens[idx].lines && tokens[idx].level === 0) {
		line = tokens[idx].lines[0];
		return '<h' + tokens[idx].hLevel + ' class="line" data-line="' + line + '"><a name="anchor' + (index++) + '">';
	}
	return '<h' + tokens[idx].hLevel + '>';
};

renderer.renderer.rules.heading_close = function(tokens, idx) {
	return '</a></h' + tokens[idx].hLevel + '>';
};

export default renderer;
