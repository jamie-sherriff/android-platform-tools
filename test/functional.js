/**
 * Created by jamie on 20/06/2017.
 */
import test from 'ava';
const fs = require('fs-extra');
const path = require('path');
const helper = require('../src/helper');
const { execFile } = require('child_process');
const adbJsPath =  require.resolve('../src/adb.js');
const fasbootJsPath =  require.resolve('../src/fastboot.js');
const dmtracedumpPath =  require.resolve('../src/dmtracedump.js');
const etc1toolPath =  require.resolve('../src/etc1tool.js');
const hprofConvPath =  require.resolve('../src/hprof-conv.js');
const sqlite3Path =  require.resolve('../src/sqlite3.js');

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
			t.truthy(tools.fasbootPath);
			t.truthy(tools.dmtracedumpPath);
			t.truthy(tools.etc1toolPath);
			t.truthy(tools.hprofconvPath);
			t.truthy(tools.sqlite3Path);
		});
});

test('Check the adb CLI returns a version', async t => {
	return helper
		.getToolPaths('platform-tools')
		.then((tools) => {
			t.truthy(tools);
			t.truthy(tools.adbPath);
			t.truthy(tools.fasbootPath);
			t.truthy(tools.dmtracedumpPath);
			t.truthy(tools.etc1toolPath);
			t.truthy(tools.hprofconvPath);
			t.truthy(tools.sqlite3Path);
			t.truthy(tools.platformToolsPath);
			return doExecCmd(tools.adbPath, ['version']);
		}).then((execResult)=>{
			t.regex(execResult.stdout, /Android Debug Bridge version/g);
			t.regex(execResult.stdout, /Installed as/);
			t.regex(execResult.stdout, /Revision/);
			t.is(execResult.stderr, '');
		});
});

test('Check the adb CLI returns an error for incorrect command', async t => {
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

/*
Run in serial to avoid the error:
- `error: could not install *smartsocket* listener: cannot bind to 127.0.0.1:5037: Only one usage of each socket address (protocol/network address/port
normally permitted. (10048)␍␊
*/

test.serial('Check the CLI can be used', async t => {
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

test.serial('Check adb CLI can be used via js', async t => {
	return doExecCmd(process.argv0, [adbJsPath, 'devices'])
		.then((execResult) => {
			const expectedStdOutRegex = new RegExp('List of devices attached','g');
			t.regex(execResult.stdout, expectedStdOutRegex);
			t.is(execResult.stderr, '');
		});
});

test('Check the adb CLI returns a version via js', async t => {
	return doExecCmd(process.argv0, [adbJsPath, 'version'])
		.then((execResult)=>{
			t.regex(execResult.stdout, /Android Debug Bridge version/g);
			t.regex(execResult.stdout, /Installed as/);
			t.regex(execResult.stdout, /Revision/);
			t.is(execResult.stderr, '');
		});
});

test('Check the fastboot CLI returns a version', async t => {
	return helper
		.getToolPaths('platform-tools')
		.then((tools) => {
			t.truthy(tools);
			t.truthy(tools.fasbootPath);
			return doExecCmd(tools.fasbootPath, ['--version']);
		}).then((execResult)=>{
			t.regex(execResult.stdout, /fastboot version/i);
			t.regex(execResult.stdout, /Installed as/);
			t.is(execResult.stderr, '');
		});
});

test('Check the fastboot CLI returns help', async t => {
	return helper
		.getToolPaths('platform-tools')
		.then((tools) => {
			t.truthy(tools);
			t.truthy(tools.fasbootPath);
			return doExecCmd(tools.fasbootPath, ['--help']);
		}).then((execResult)=>{
			t.fail('exec Should not get here ' + JSON.stringify(execResult));
		})
		.catch((execResult)=>{
			t.regex(execResult.stderr, /usage: fastboot/);
			t.regex(execResult.stderr, /flashing/);
			t.regex(execResult.stderr, /flashing lock/);
			t.regex(execResult.stderr, /flashing unlock/);
			t.regex(execResult.stderr, /erase/);
			t.regex(execResult.stderr, /update <filename>/);
			t.is(execResult.stdout, '');
		});
});

test('Check the fastboot CLI returns an error for incorrect command', async t => {
	return helper
		.getToolPaths('platform-tools')
		.then((tools) => {
			t.truthy(tools);
			t.truthy(tools.fasbootPath);
			return doExecCmd(tools.fasbootPath, ['--garbage']);
		})
		.then((execResult)=>{
			t.fail('exec Should not get here ' + JSON.stringify(execResult));
		})
		.catch((execResult)=>{
			t.is(execResult.code, 1);
			t.not(execResult.killed);
			t.falsy(execResult.signal);
			//unrecognized option on unix  and unknown option on windows
			t.regex(execResult.stderr, /(unknown option|unrecognized option)/);
			//no space on unix
			t.regex(execResult.stderr, /(-- garbage|--garbage)/);
			t.is(execResult.stdout, '');
		});
});

test('Check the fastboot cli returns a version via js', async t => {
	return doExecCmd(process.argv0, [fasbootJsPath, '--version'])
		.then((execResult)=>{
			t.regex(execResult.stdout, /fastboot version/i);
			t.regex(execResult.stdout, /Installed as/);
			t.is(execResult.stderr, '');
		});
});

test('Check the dmtracedump cli returns something via js', async t => {
	return doExecCmd(process.argv0, [dmtracedumpPath, '-garbage'])
		.then((execResult)=>{
			t.regex(execResult.stderr, /usage:/);
			t.regex(execResult.stderr, /dmtracedump/);
			t.regex(execResult.stderr, /trace-file-name/);
			t.regex(execResult.stderr, /[-ho]/);
			t.regex(execResult.stderr, /[-d trace-file-name]/);
			t.is(execResult.stdout, '');
		});
});


test('Check the etc1tool cli returns something via js', async t => {
	return doExecCmd(process.argv0, [etc1toolPath, '--help'])
		.then((execResult)=>{
			t.regex(execResult.stderr, /etc1tool/);
			t.regex(execResult.stderr, /infile/);
			t.regex(execResult.stderr, /--encode/);
			t.regex(execResult.stderr, /--encodeNoHeader/);
			t.regex(execResult.stderr, /create an ETC1 file from a PNG file./);
			t.regex(execResult.stderr, /If outfile is not specified, an outfile path is constructed from infile/);
			t.is(execResult.stdout, '');
		});
});

test('Check the hprof-conv cli returns something via js', async t => {
	return doExecCmd(process.argv0, [hprofConvPath, '-help'])
		.then((execResult)=>{
			t.regex(execResult.stderr, /hprof-conv/);
			t.regex(execResult.stderr, /(unknown option|invalid option)/);//unix is invalid option
			t.regex(execResult.stderr, /Usage: hprof-conf/);
			t.regex(execResult.stderr, /infile outfile/);
			t.is(execResult.stdout, '');
		});
});

test('Check the sqlite3 cli returns something via js', async t => {
	return doExecCmd(process.argv0, [sqlite3Path, '-help'])
		.then((execResult)=>{
			t.regex(execResult.stderr, /sqlite3/);
			t.regex(execResult.stderr, /FILENAME is the name of an SQLite database/);
			t.regex(execResult.stderr, /OPTIONS include:/);
			t.regex(execResult.stderr, /-version/);
			t.regex(execResult.stderr, /show SQLite version/);
			t.is(execResult.stdout, '');
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
