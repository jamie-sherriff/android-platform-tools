/**
 * Created by jamie on 20/06/2017.
 */
import test from 'ava';
const fs = require('fs-extra');
const path = require('path');
const helper = require('../helper');
const { execFile } = require('child_process');

function doExecCmd(cmd, args){
	return new Promise((resolve, reject)=>{
		execFile(cmd, args, (error, stdout, stderr)=>{
			if(error){
				error.stdout = stdout;
				error.stderr = stderr;
				reject(error);
			} else {
				resolve({stdout, stderr});
			}
		});
	});
}

const _invalidateRequireCacheForFile = function (filePath) {
	delete require.cache[require.resolve(filePath)];
};

const requireNoCache = function (filePath) {
	_invalidateRequireCacheForFile(filePath);
	return require(filePath);
};

test.before('Kill the adb server', async t => {
	return helper
		.getToolPaths('platform-tools')
		.then((tools) => {
			if(tools){ //don't run if don't exist
				return doExecCmd(tools.adbPath, ['kill-server']);
			}
			t.pass();
		});
});

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

test('Check the CLI returns a version', async t => {
	return helper
		.getToolPaths('platform-tools')
		.then((tools) => {
			t.truthy(tools);
			t.truthy(tools.adbPath);
			t.truthy(tools.platformToolsPath);
			return doExecCmd(tools.adbPath, ['version']);
		}).then((execResult)=>{
			t.regex(execResult.stdout, /Android Debug Bridge version/g);
			t.regex(execResult.stdout, /Installed as/);
			t.regex(execResult.stdout, /Revision/);
			t.is(execResult.stderr, '');
		});
});

test('Check the CLI returns an error for incorrect command', async t => {
	return helper
		.getToolPaths('platform-tools')
		.then((tools) => {
			t.truthy(tools);
			t.truthy(tools.adbPath);
			return doExecCmd(tools.adbPath, ['garbage']);
		})
		.then((execResult)=>{
			t.fail('exec Should not get here ' + JSON.stringify(execResult));
		})
		.catch((execResult)=>{
			t.is(execResult.code, 1);
			t.not(execResult.killed);
			t.falsy(execResult.signal);
			t.regex(execResult.stdout, /Android Debug Bridge version/gm);
			t.regex(execResult.stdout, /global options:/);
			t.regex(execResult.stdout, /general commands:/);
			t.regex(execResult.stdout, /environment variables:/);
			t.is(execResult.stderr, '');
		});
});

test('Check the CLI can be used', async t => {
	return helper
		.getToolPaths('platform-tools')
		.then((tools) => {
			t.truthy(tools);
			t.truthy(tools.adbPath);
			return doExecCmd(tools.adbPath, ['devices']);
		}).then((execResult) => {
			const expectedStdOutRegex = new RegExp('List of devices attached','g');
			t.regex(execResult.stdout, expectedStdOutRegex);
			t.is(execResult.stderr, '');
		});
});

test.after.always('Cleanup the adb server', t => {
	return helper
		.getToolPaths('platform-tools')
		.then((tools) => {
			t.truthy(tools);
			t.truthy(tools.adbPath);
			return doExecCmd(tools.adbPath, ['kill-server']);
		});
});
