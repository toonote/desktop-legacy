import test from 'ava';
import path from 'path';
import {Application} from 'spectron';

function sleep(timeout){
	return new Promise((resolve, reject) => {
		setTimeout(resolve, timeout);
	});
}

test.beforeEach(async t => {
	t.context.app = new Application({
		path: path.join(__dirname, '../node_modules/.bin/electron'),
		args: [path.join(__dirname, '../')]
	});

	await t.context.app.start();
	await t.context.app.client.waitUntilWindowLoaded();
});

test.afterEach(async t => {
	try{
		await t.context.app.stop();
	}catch(e){
		console.log('app exit error:', e.message);
	}
});

test('main app running', async t => {
	const app = t.context.app;
	let browserWindow = app.browserWindow;
	t.truthy(browserWindow, 'browserWindow exists');
	t.false(await browserWindow.isMinimized(), 'browserWindow not minimized');
	t.false(await browserWindow.isDevToolsOpened(), 'devTools not open');
	t.true(await browserWindow.isVisible(), 'browserWindow visible');
	let bounds = await browserWindow.getBounds();
	t.true(bounds.width > 0, 'width > 0');
	t.true(bounds.height > 0, 'height > 0');

	const client = app.client;
	// 获取旧数据
	let storage = await client.localStorage();
	let oldValue = {};
	t.truthy(storage.status === 0, 'get localStorage success');
	let oldValueKeys = storage.value.filter((key)=>{
		return key.indexOf('TooNote-LocalStorage-Key-Test-') === 0;
	});

	for(let i = 0;i < oldValueKeys.length;i++){
		let key = oldValueKeys[i];
		oldValue[key] = await client.localStorage('GET', key).value;
	}

	// 备份旧数据
	// require('fs').writeFileSync(`./tests/oldValue_${Date.now()}.json`, JSON.stringify(oldValue));

	// 清空数据
	for(let i = 0;i < oldValueKeys.length;i++){
		let key = oldValueKeys[i];
		await client.localStorage('DELETE', key);
	}

	// 刷新
	await app.restart();
	await app.client.waitUntilWindowLoaded();
	// const browserWindow = app.browserWindow;
	const $ = app.client.$;
	// editor存在
	let aceLayers = await app.client.$$('.ace_layer');
	t.true(aceLayers.length === 6, 'ace editor inited.');
	let editorSize = await app.client.getElementSize('#ace_container');
	t.true(editorSize.width === 474, 'width 474');
	t.true(editorSize.height === 778, 'height 778');

	// 内容
	// console.log(await app.client.$('#ace_container'));
});
