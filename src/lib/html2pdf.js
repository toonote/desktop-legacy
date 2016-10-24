var system = require('system');
var args = system.args;
var output = args[2];
var page = require('webpage').create();
page.paperSize = {
	format: 'A4',
	orientation: 'portrait',
	border: '2cm'
};
page.open(args[1], function() {
	page.evaluate(function() {
	    document.body.style.background = 'white';
	});
	page.render(output);
	phantom.exit();
});
