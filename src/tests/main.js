import test from 'ava';
import path from 'path';
import {Application} from 'spectron';

test.beforeEach(t => {
	t.context.app = new Application({
		path: path.join(__dirname, '../node_modules/.bin/electron'),
		args: [path.join(__dirname, '../')]
	});

	return t.context.app.start();
});

test.afterEach(t => {
	return t.context.app.stop();
});

test('main app running', async t => {
	let client = t.context.app.client.waitUntilWindowLoaded();
	let browserWindow = client.browserWindow;
	t.truthy(browserWindow, 'browserWindow exists');
	t.false(await browserWindow.isMinimized(), 'browserWindow not minimized');
	t.false(await browserWindow.isDevToolsOpened(), 'devTools not open');
	t.true(await browserWindow.isVisible(), 'browserWindow visible');
	let bounds = await browserWindow.getBounds();
	t.true(bounds.width > 0, 'width > 0');
	t.true(bounds.height > 0, 'height > 0');
	return client;
});
