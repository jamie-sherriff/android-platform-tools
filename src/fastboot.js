#!/usr/bin/env node
'use strict';
const helper = require('./helper');
const userArgs = process.argv.slice(2); //drop node and .js file
const adb = require('../index');

helper.getToolPaths().then((resolvedPaths) => {
	if (resolvedPaths !== null) {
		helper.spawnProcess(resolvedPaths.fastbootPath, userArgs);
	} else {
		console.log('Did not find local platform-tools');
		return adb.downloadAndReturnToolPaths().then((paths) => {
			console.log(`Platform tools downloaded to: ${paths.platformToolsPath}`);
			if (paths.fastbootPath !== null) {
				helper.spawnProcess(paths.fastbootPath, userArgs);
			} else {
				console.error(`encountered unknown error,exiting... ${JSON.stringify(paths)}}`);
				process.exit(1);
			}
		});
	}
});
