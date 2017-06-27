/**
 * Created by jamie on 20/06/2017.
 */
//const helper = require('../helper');
import test from 'ava';
const fs = require('fs-extra');
const path = require('path');

const _invalidateRequireCacheForFile = function (filePath) {
	delete require.cache[require.resolve(filePath)];
};

const requireNoCache = function (filePath) {
	_invalidateRequireCacheForFile(filePath);
	return require(filePath);
};

test.serial('Download SDK via downloadTools', async t => {
	process.env['ADB_ZIP_CACHE'] = true;
	const adb = requireNoCache('../index');
	return fs
		.remove(path.resolve(__dirname, 'platform-tools'))
		.then(() => {
			return adb.downloadTools();
		})
		.then((tools) => {
			t.truthy(tools);
			t.truthy(tools.path);
			t.truthy(tools.message);
			t.truthy(tools.zipPath);
			return fs.exists(tools.zipPath);
		})
		.then((zipPath) => {
			t.true(zipPath);
		});
});

test.serial('Download SDK via downloadAndReturnToolPaths', async t => {
	const adb = requireNoCache('../index');
	return fs
		.remove(path.resolve(__dirname, 'platform-tools'))
		.then(() => {
			return adb.downloadAndReturnToolPaths();
		})
		.then((tools) => {
			t.truthy(tools);
			t.truthy(tools.adbPath);
			t.truthy(tools.platformToolsPath);
		});
});