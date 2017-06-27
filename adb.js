/**
 * Created by jamie on 17/06/2017.
 */
'use strict';
const helper = require('./helper');
const userArgs = process.argv.slice(2); //drop node and .js file
const spawn = require('child_process').spawn;
const chalk = require('chalk');
const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
const highlightErrors = process.env['ADB_HIGHLIGHT_ERRORS'] || true;
const rainbowMode = process.env['ADB_RAINBOW'] || false;
const errorRegex = new RegExp('error','i');
const adb = require('./index');

function logRawLine(line){
	process.stdout.write(line);
}

function lineLoggerMap(line) {
	if (line.length > 0) {
		if(rainbowMode){
			let randomInt = Math.floor(Math.random() * colors.length);
			let info = chalk[colors[randomInt]];
			process.stdout.write(info(line));
		} else if (highlightErrors){
			if(errorRegex.test(line)){
				let error = chalk['red'];
				process.stdout.write((error(line)));
			} else{
				logRawLine(line);
			}
		} else{
			logRawLine(line);
		}
	}
}

function stdoutToLines(stdout) {
	let stdoutString = stdout.toString();
	stdoutString.split('\r').map(lineLoggerMap);
}

function spawnADB(path) {
	let spawnOptions = {};
	if (spawnOptions.inherit) {
		spawnOptions.stdio = 'inherit';
	}
	spawnOptions.stdio = 'inherit';
	let adbProcess = spawn(path, userArgs, {stdio: ['inherit',null,'inherit']});
	console.log(`${path} ${userArgs}`);
	adbProcess.on('error', (err) => {
		console.error(`Failed to start child process. ${err}`);
		process.exit(1);
	});
	adbProcess.stdout.on('data', (data) => {
		stdoutToLines(data);
	});
}

helper.getToolPaths().then((resolvedPaths) => {
	if (resolvedPaths !== null) {
		spawnADB(resolvedPaths.adbPath);
	} else {
		console.log('Did not find local platform-tools');
		return adb.downloadAndReturnToolPaths().then((paths) => {
			console.log(`Platform tools downloaded to: ${paths.platformToolsPath}`);
			if (paths.adbPath !== null) {
				spawnADB(paths.adbPath);
			} else {
				console.error(`encountered unknown error,exiting... ${JSON.stringify(paths)}}`);
				process.exit(1);
			}
		});
	}
});
