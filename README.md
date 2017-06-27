# android-platform-tools #
This is a fully self contained module that wraps the Android SDK platform tools

This grabs the latest SDK Platform tools from https://developer.android.com/studio/releases/platform-tools.html

Fully multi platform Tested on windows and Linux. Also should work on Mac OS, please let me know if it does not.

It will Also store the Android platform tools locally and check it exists at runtime so it does not download each time.

## Requirements ##
* NodeJs 4+

## Command Line Interface Usage ##
* `npm install -g android-platform-tools` 
* `adbn devices` or `adb devices` 
* `adbn` to avoid path conflicts with any existing android sdk installation with adb
 
 Returns the usual: `List of devices attached`
 
 #### CLI Customisation ####
 The following environment variables are available
 
 * ADB_HIGHLIGHT_ERRORS (Highlights the word error in stdout in red)
 * ADB_RAINBOW (Makes each line in stdout a different color and windows environment friendly)

## Programmatic Usage ##
~~~~

const adb = require('android-platform-tools');
  
//downloadOnly
return adb
    .downloadTools()
    .then((tools) => {
        const toolsPath = tools.path;
    });
//downloadWithValidationAndAdb
return adb
    .downloadAndReturnToolPaths()
    .then((tools) => {
        const adbPath = tools.adbPath;
        const platformToolsPath = tools.platformToolsPath;
    });
~~~~

## Contributions ##
* Always welcome 

## Roadmap ##
* more customisation of the platform tools path, currently defaults to __dirname and "platform-tools"
* Also consult TODO.txt

## Known Issues ##
* `adb shell` is a bit sluggish for input and will look into this
* Please add any issues you find to github

### Running Tests ###
* `npm test`

### Checking code style ###
* `npm run lint`

### Contributing guidelines ###
* Write tests
* Check linting
* Do a Pull request

### Legal ###
*By using this module you agree to any terms and conditions outlined by Google,
documented in the NOTICE.txt under the platform tools installation

### Any Questions? ###
* Feel free to contact me on github