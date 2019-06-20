'use strict';
const helper = require('./src/helper');
const fs = require('fs-extra');
const path = require('path');
const debug = require('debug')('adb:index');
const request = require('request');
const ProgressBar = require('progress');
const extract = require('extract-zip');
const zipCache = process.env['ADB_ZIP_CACHE'] || null;
const WORKING_DIRECTORY = process.cwd();


//TODO add a option useLocalZip
function downloadTools(toolDirName) {
	if(!toolDirName){
		toolDirName = 'platform-tools';
	}
	return new Promise((resolve, reject) =>{
		const androidToolZipPath = path.join(WORKING_DIRECTORY, 'android-sdk.zip');
		const androidToolDir = path.join(WORKING_DIRECTORY, toolDirName);
		const downloadUrl = helper.getOSUrl();
		console.log(`Downloading Android platform tools from: ${downloadUrl}`);
		const requestOptions = {timeout: 30000, 'User-Agent': helper.getUserAgent()};
		request(downloadUrl, requestOptions)
			.on('error', (error)  => {
				debug(`Request Error ${error}`);
				reject(error);
			})
			.on('response', (response)  => {
				const len = parseInt(response.headers['content-length'], 10);
				let bar = new ProgressBar('  downloading [:bar] :percent :etas', {
					complete: '=',
					incomplete: ' ',
					width: 20,
					total: len
				});

				response.on('data', function (chunk) {
					if (chunk.length){
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
			.on('finish', ()  => {
				debug('wstream finished');
				console.log('Extracting Android SDK');
				extract(androidToolZipPath, {dir: WORKING_DIRECTORY},(error) =>{
					if(error){
						debug(`Extraction failed: ${error}`);
						reject(error);
					} else{
						console.log('Extraction complete');
						debug('downloadSDK complete');

						fs.move(path.join(WORKING_DIRECTORY,'platform-tools'), androidToolDir,  copyError => {
							if (copyError){
								console.error(`copy dir failed: ${copyError}`);
								reject(copyError);
							} else{
								if(zipCache !== null){
									resolve({path:androidToolDir, message:'downloadSDK complete', zipPath:androidToolZipPath});
									return;
								}
								fs.remove(androidToolZipPath, removeError => {
									if (removeError) {
										console.error(`removing zip file failed: ${removeError}`);
										reject(removeError);
									} else {
										console.log('Removed platform-tools zip file, please specify ADB_ZIP_CACHE if you wish to keep it');
										resolve({path:androidToolDir, message:'downloadSDK complete'});
									}
								});
							}

							console.log('success!');
						}); // copies file
					}
				});
			});
	});
}

function downloadAndReturnToolPaths(toolPath) {
	if(!toolPath){
		toolPath = 'platform-tools';
	}
	return downloadTools(toolPath)
		.then((platformTools) => {
			return helper.checkSdkExists(platformTools.path);
		})
		.then((exists) => {
			if (exists === true) {
				return helper.getToolPaths();
			} else {
				console.error('something went wrong');
				return exists;
			}
		});
}

module.exports.downloadAndReturnToolPaths = downloadAndReturnToolPaths;
module.exports.downloadTools = downloadTools;