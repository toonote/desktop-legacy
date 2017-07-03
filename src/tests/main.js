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

test(async t => {
	let client = t.context.app.client.waitUntilWindowLoaded();
	let browserWindow = client.browserWindow;
	t.false(await browserWindow.isMinimized());
	t.true(await browserWindow.isDevToolsOpened());
	t.true(await browserWindow.isVisible());
	let bounds = await browserWindow.getBounds();
	t.true(bounds.width > 0);
	t.true(bounds.height > 0);
	return client;
	/*return
		t.context.app.client.waitUntilWindowLoaded()
		.getWindowCount().then(count => {
			// t.is(count, 1);
		}).browserWindow.isMinimized().then(min => {
			t.false(min);
		}).browserWindow.isDevToolsOpened().then(opened => {
			t.true(opened);
		}).browserWindow.isVisible().then(visible => {
			t.true(visible);
		}).browserWindow.isFocused().then(focused => {
			// t.true(focused);
		}).browserWindow.getBounds().then(bounds => {
			t.true(bounds.width > 0);
			t.true(bounds.height > 0);
		});*/
});
