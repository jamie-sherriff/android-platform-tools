'use strict';
const helper = require('./src/helper');
const fs = require('fs-extra');
const path = require('path');
const debug = require('debug')('adb:index');
const request = require('request');
const ProgressBar = require('progress');
const extract = require('extract-zip');
const zipCache = process.env['ADB_ZIP_CACHE'] || null;
const DEFAULT_BASE_DIRECTORY =  path.resolve(__dirname);
const DEFAULT_TOOL_DIR_NAME = 'platform-tools';

function unzipPackage(androidToolDir, androidToolZipPath) {
	return new Promise((resolve, reject) => {
		if (zipCache !== null) {
			resolve({path: androidToolDir, message: 'downloadSDK complete', zipPath: androidToolZipPath});
			return;
		}
		fs.remove(androidToolZipPath, removeError => {
			if (removeError) {
				console.error(`removing zip file failed: ${removeError}`);
				reject(removeError);
			} else {
				console.log('Removed platform-tools zip file, please specify ADB_ZIP_CACHE if you wish to keep it');
				resolve({path: androidToolDir, message: 'downloadSDK complete'});
			}
		});
		console.log('success!');
	});
}

function onDownloadFinish(androidToolDir, androidToolZipPath, baseDirectory) {
	return new Promise((resolve, reject) => {
		extract(androidToolZipPath, {dir: baseDirectory}, (error) => {
			if (error) {
				debug(`Extraction failed: ${error}`);
				reject(error);
			} else {
				console.log('Extraction complete');
				debug('downloadSDK complete');
				resolve('Success');
			}
		});
	}).then(()=>{
		const fullToolPath = path.join(baseDirectory, 'platform-tools');
		if(fullToolPath !== androidToolDir){
			debug(`Moving ${fullToolPath} to ${androidToolDir}`);
			return fs.move(path.join(baseDirectory, 'platform-tools'), androidToolDir, {overwrite: true});
		}
	}).then(() => {
		return unzipPackage(androidToolDir, androidToolZipPath);
	});
}


//TODO add a option useLocalZip
function downloadTools(toolDirName= DEFAULT_TOOL_DIR_NAME, baseDirectory = DEFAULT_BASE_DIRECTORY) {
	return new Promise((resolve, reject) => {
		const androidToolZipPath = path.join(baseDirectory, 'android-sdk.zip');
		const androidToolDir = path.join(baseDirectory, toolDirName);
		const downloadUrl = helper.getOSUrl();
		console.log(`Downloading Android platform tools from: ${downloadUrl}`);
		const requestOptions = {timeout: 30000, 'User-Agent': helper.getUserAgent()};
		request(downloadUrl, requestOptions)
			.on('error', (error) => {
				debug(`Request Error ${error}`);
				reject(error);
			})
			.on('response', (response) => {
				const len = parseInt(response.headers['content-length'], 10);
				let bar = new ProgressBar('  downloading [:bar] :percent :etas', {
					complete: '=',
					incomplete: ' ',
					width: 20,
					total: len
				});

				response.on('data', function (chunk) {
					if (chunk.length) {
						bar.tick(chunk.length);
					}
				});

				response.on('end', function () {
					console.log('\n');
				});
				debug(response.statusCode);
				debug(response.headers['content-type']);
			})
			.pipe(fs.createWriteStream(androidToolZipPath))
			.on('finish', () => {
				debug('wstream finished');
				console.log('Extracting Android SDK');
				return onDownloadFinish(androidToolDir, androidToolZipPath, baseDirectory)
					.then((pathObject) => {
						resolve(pathObject);
					})
					.catch((error) => {
						reject(error);
					});
			});
	});
}

function downloadAndReturnToolPaths(toolPath ='platform-tools', baseDirectory = DEFAULT_BASE_DIRECTORY) {
	debug(`Using toolpath: ${toolPath}`);
	debug(`Using baseDirectory: ${baseDirectory}`);
	return downloadTools(toolPath)
		.then((platformTools) => {
			return helper.checkSdkExists(platformTools.path, baseDirectory);
		})
		.then((exists) => {
			if (exists === true) {
				return helper.getToolPaths(toolPath, baseDirectory);
			} else {
				console.error('something went wrong');
				return exists;
			}
		});
}

module.exports.downloadAndReturnToolPaths = downloadAndReturnToolPaths;
module.exports.downloadTools = downloadTools;