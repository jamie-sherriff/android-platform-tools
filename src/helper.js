'use strict';
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const debug = require('debug')('adb:helper');
const WINDOWS_URL = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';
const LINUX_URL = 'https://dl.google.com/android/repository/platform-tools-latest-linux.zip';
const OSX_URL = 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip';
const packageJson = require('./package.json');

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

function getUserAgent () {
	const nodeString = `NodeJs/${process.version}`;
	const packageString = `${packageJson.name}/${packageJson.version}`;
	const computerString = `Hostname/${os.hostname()} Platform/${os.platform()} PlatformVersion/${os.release()}`;
	return `${packageString} ${nodeString} ${computerString}`;
}


function getExecutablebyOS() {
	const currentOS = os.platform();
	switch (currentOS) {
	case 'win32':
		return 'adb.exe';
	case 'darwin':
		return 'adb';
	case 'linux':
		return 'adb';
	default:
		console.log(`Using unknown OS of ${currentOS} ,defaulting to linux`);
		return LINUX_URL;
	}
}
function getToolPaths (platformToolsDirName){
	if(!platformToolsDirName){
		platformToolsDirName = 'platform-tools';
	}
	const adbBinary = getExecutablebyOS();
	const adbPath = path.resolve(__dirname, platformToolsDirName, adbBinary);
	const platformToolsPath = path.resolve(__dirname, platformToolsDirName);
	return fs.pathExists(adbPath).then((exists)=>{
		if (exists === true){
			return {adbPath:adbPath, platformToolsPath:platformToolsPath};
		} else {
			return null;
		}
	});
}

module.exports.checkSdkExists = (toolPath)=>{
	const toolDir = path.resolve(__dirname, toolPath);
	return fs.pathExists(toolDir).then((exists)=>{
		return exists === true;
	});
};

module.exports.getToolPaths = getToolPaths;
module.exports.getOSUrl = getOSUrl;
module.exports.getExecutablebyOS = getExecutablebyOS;
module.exports.getUserAgent = getUserAgent;