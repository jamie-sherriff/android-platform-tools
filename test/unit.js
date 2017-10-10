/**
 * Created by jamie on 20/06/2017.
 */
const helper = require('../src/helper');
const os = require('os');
import test from 'ava';


test('undefined getExecutablebyOS throws', t => {
	const error = t.throws(() => {
		helper.getExecutablebyOS();
	}, Error);

	t.is(error.message, 'getExecutablebyOS needs a name param');
});

test('adb getExecutablebyOS', t => {
	const adbExec = helper.getExecutablebyOS('adb');
	if(os.platform() === 'win32'){
		t.true(/.exe/.test(adbExec));
	} else{
		t.false(/.exe/.test(adbExec));
	}
	t.true(/adb/.test(adbExec));
});

test('getOSUrl', t => {
	const toolUrl = helper.getOSUrl();
	if(os.platform() === 'win32'){
		t.true(/.windows/.test(toolUrl));
	} else if(os.platform() === 'darwin'){
		t.true(/.darwin/.test(toolUrl));
	} else {
		t.true(/.linux/.test(toolUrl));
	}
});

test('getUserAgent', t => {
	const userAgent = helper.getUserAgent();
	t.regex(userAgent, /Hostname/);
	t.regex(userAgent, /Platform/);
	t.regex(userAgent, /PlatformVersion/);
});