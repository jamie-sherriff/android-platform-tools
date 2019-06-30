3.0.0 / 2019-06-25
==================
* BREAKING: change logic for issue #1 to default to __dirname but can be overridden instead
- The following syntax is an example 
```adb.downloadAndReturnToolPaths('custom-path3', process.cwd())```


2.0.1 / 2019-06-25
==================
* Fix issue #3 Custom paths not working

2.0.0 / 2019-01-30 
==================
* Major version bump due to solving dirnames issue #1
* fix fastboot spelling mistake issue #2

1.3.0 / 2017-12-27 
==================
* Bump major versions of dependencies

1.2.0 / 2017-12-27 
==================
* Fix failing tests, MacOs test coverage
* Update dependencies

1.1.0 / 2017-11-21 
==================
* Fix failing tests due to changed output in android tools when querying help

1.1.0 / 2017-10-10 
==================
* Don't call process.exit, let error propagate Behaviour change so minor version bump.
* Fix silly typos in some error conditions
* Improve test reliability 

1.0.0 / 2017-10-10 
==================
* First proper release
* Add all other platform tool commands
* fastboot, sqlite3, etc1tool, fastboot, hprof-conv, sqlite3
* ADB should be backwards compatible but directory structure has changed
* Add TOOL_LOGGING environment var too show extra console.logs
* Functional test coverage of all tools

0.0.12 / 2017-09-28
==================
* Update dependencies
* Start recording changelog (see commit history for previous history)