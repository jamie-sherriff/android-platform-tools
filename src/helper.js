'use strict';
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const debug = require('debug')('adb:helper');
const spawn = require('child_process').spawn;
const chalk = require('chalk');
const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
const highlightErrors = process.env['ADB_HIGHLIGHT_ERRORS'] || true;
const rainbowMode = process.env['ADB_RAINBOW'] || false;
const moreLogging = process.env['TOOL_LOGGING'] || false;
const errorRegex = new RegExp('error:', 'i');

const WINDOWS_URL = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';
const LINUX_URL = 'https://dl.google.com/android/repository/platform-tools-latest-linux.zip';
const OSX_URL = 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip';
const packageJson = require('../package.json');
const DEFAULT_BASE_DIRECTORY =  path.resolve(__dirname + '../..');
const DEFAULT_TOOL_DIR_NAME = 'platform-tools';

function getOSUrl() {
	const currentOS = os.platform();
	debug('Getting android SDK for platform: ' + currentOS);
	switch (currentOS) {
	case 'win32':
		return WINDOWS_URL;
	case 'darwin':
		return OSX_URL;
	case 'linux':
		return LINUX_URL;
	default:
		console.log(`Using undefined OS of ${currentOS} ,defaulting to linux`);
		return LINUX_URL;
	}
}

function getUserAgent() {
	const nodeString = `NodeJs/${process.version}`;
	const packageString = `${packageJson.name}/${packageJson.version}`;
	const computerString = `Hostname/${os.hostname()} Platform/${os.platform()} PlatformVersion/${os.release()}`;
	return `${packageString} ${nodeString} ${computerString}`;
}

function getExecutablebyOS(name) {
	if(!name){
		throw new Error('getExecutablebyOS needs a name param');
	}
	const currentOS = os.platform();
	switch (currentOS) {
	case 'win32':
		return `${name}.exe`;
	case 'darwin':
		return `${name}`;
	case 'linux':
		return `${name}`;
	default:
		console.log(`Using unknown OS of ${currentOS} ,defaulting to linux`);
		return LINUX_URL;
	}
}


function getToolPaths(platformToolsDirName =  DEFAULT_TOOL_DIR_NAME, baseDirectory = DEFAULT_BASE_DIRECTORY) {
	const adbBinary = getExecutablebyOS('adb');
	const fastBootBinary = getExecutablebyOS('fastboot');
	const dmtracedumpBinary = getExecutablebyOS('dmtracedump');
	const etc1toolBinary = getExecutablebyOS('etc1tool');
	const hprofconvBinary = getExecutablebyOS('hprof-conv');
	const sqlite3Binary = getExecutablebyOS('sqlite3');
	const adbPath = path.resolve(baseDirectory, platformToolsDirName, adbBinary);
	const fastbootPath = path.resolve(baseDirectory, platformToolsDirName, fastBootBinary);
	const dmtracedumpPath = path.resolve(baseDirectory, platformToolsDirName, dmtracedumpBinary);
	const etc1toolPath = path.resolve(baseDirectory, platformToolsDirName, etc1toolBinary);
	const hprofconvPath = path.resolve(baseDirectory, platformToolsDirName, hprofconvBinary);
	const sqlite3Path = path.resolve(baseDirectory, platformToolsDirName, sqlite3Binary);
	const platformToolsPath = path.resolve(baseDirectory, platformToolsDirName);
	return fs.pathExists(adbPath).then((exists) => {
		if (exists === true) {
			return {
				adbPath,
				platformToolsPath,
				fastbootPath,
				dmtracedumpPath,
				etc1toolPath,
				hprofconvPath,
				sqlite3Path
			};
		} else {
			return null;
		}
	});
}

function logRawLine(line) {
	process.stdout.write(line);
}

function lineLoggerMap(line) {
	if (line.length > 0) {
		if (rainbowMode) {
			let randomInt = Math.floor(Math.random() * colors.length);
			let info = chalk[colors[randomInt]];
			process.stdout.write(info(line));
		} else if (highlightErrors) {
			if (errorRegex.test(line)) {
				let error = chalk['red'];
				process.stdout.write((error(line)));
			} else {
				logRawLine(line);
			}
		} else {
			logRawLine(line);
		}
	}
}

function stdoutToLines(stdout) {
	let stdoutString = stdout.toString();
	stdoutString.split('\r').map(lineLoggerMap);
}


function spawnProcess(path, userArgs) {
	let spawnOptions = {};
	if (spawnOptions.inherit) {
		spawnOptions.stdio = 'inherit';
	}
	spawnOptions.stdio = 'inherit';
	let toolProcess = spawn(path, userArgs, {stdio: ['inherit', null, 'inherit']});
	if(moreLogging) {
		console.log(`${path} ${userArgs}`);
	}
	toolProcess.on('error', (err) => {
		console.error(`Failed to start child process. ${err}`);
		process.exit(1);
	});
	toolProcess.stdout.on('data', (data) => {
		stdoutToLines(data);
	});
}

module.exports.checkSdkExists = (toolPath, baseDirectory) => {
	const toolDir = path.resolve(baseDirectory, toolPath);
	return fs.pathExists(toolDir).then((exists) => {
		return exists === true;
	});
};

module.exports.getToolPaths = getToolPaths;
module.exports.getOSUrl = getOSUrl;
module.exports.getExecutablebyOS = getExecutablebyOS;
module.exports.getUserAgent = getUserAgent;
module.exports.spawnProcess = spawnProcess;