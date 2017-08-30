const test = require('tape');
var td = require('testdouble');

const FirmwareUpdater = require('../az-firmware-updater');

test('az-firmware-updater-tests', function (group) {
    group.test('if apply image option is not passed then fail', function (t) {
        t.plan(1);

        const options = {}

        const updater = new FirmwareUpdater(stubClient(), options);

        updater.applyImage("/test/path").catch(err => {
            t.equal(err, 'applyImage option must be function')
        });
    });

    group.test('if apply image option is null then fail', function (t) {
        t.plan(1);

        const options = {
            applyImage: null
        }

        const updater = new FirmwareUpdater(stubClient(), options);

        updater.applyImage("/test/path").catch(err => {
            t.equal(err, 'applyImage option must be function')
        });
    });

    group.test('if apply image option is not a function fail', function (t) {
        t.plan(1);

        const options = {
            applyImage: 42
        }

        const updater = new FirmwareUpdater(stubClient(), options);

        updater.applyImage("/test/path").catch(err => {
            t.equal(err, 'applyImage option must be function')
        });
    });

    group.test('if apply image option is a function and promise call it', function (t) {
        t.plan(2);

        const options = {
            applyImage: function () {
                t.pass("function was called!")
                return Promise.resolve();
            }
        }

        const updater = new FirmwareUpdater(stubClient(), options);

        updater.applyImage("/test/path")
            .then(_ => {
                t.pass("promise was resolved");
            })
            .catch(err => {
                t.fail("should not get here");
            });
    });

    group.test('if apply image option does not return promise still work', function (t) {
        t.plan(2);

        const options = {
            applyImage: function () {
                const answerToLife = 20 + 22;
                t.pass("call function");
                return answerToLife;
            }
        }

        const updater = new FirmwareUpdater(stubClient(), options);

        updater.applyImage("/test/path")
            .then(result => {
                console.log(result);
                t.equal(result, 42);
            }).catch(err => {
                t.fail('should not get here');
            });
    });

    group.test('if apply image option does not return value promise still work', function (t) {
        t.plan(2);

        const options = {
            applyImage: function () {
                t.pass("call function");
                return;
            }
        }

        const updater = new FirmwareUpdater(stubClient(), options);

        updater.applyImage("/test/path")
            .then(result => {
                console.log(result);
                t.equal(result, undefined);
            }).catch(err => {
                t.fail('should not get here');
            });
    });

    group.test('if apply image option does not return still work', function (t) {
        t.plan(2);

        const options = {
            applyImage: function () {
                t.pass("call function");
            }
        }

        const updater = new FirmwareUpdater(stubClient(), options);

        updater.applyImage("/test/path")
            .then(result => {
                console.log(result);
                t.equal(result, undefined);
            }).catch(err => {
                t.fail('should not get here');
            });
    });

    group.test('if restart option is not passed return', function (t) {
        t.plan(1);

        const options = {}

        const updater = new FirmwareUpdater(stubClient(), options);

        updater.restart()
            .then(_ => {
                t.pass("should get here");
            }).catch(err => {
                t.fail('should not get here');
            });
    });

    group.test('if restart option is null return', function (t) {
        t.plan(1);

        const options = {
            restart: null
        }

        const updater = new FirmwareUpdater(stubClient(), options);

        updater.restart()
            .then(_ => {
                t.pass("should get here");
            }).catch(err => {
                t.fail('should not get here');
            });
    });

    group.test('if restart option is not a function then fail', function (t) {
        t.plan(1);

        const options = {
            restart: 33
        }

        const updater = new FirmwareUpdater(stubClient(), options);

        updater.restart().catch(err => {
            t.equal(err, 'restart option must be function')
        });
    });

    group.test('if restart option is a function and promise call it', function (t) {
        t.plan(2);
        
        // something wierd with Test double keeping around reporter module so scoped it here.
        // this is probably not the best way to do this but the td.reset() wasn't working.
        const HubReporter = td.replace('../lib/hub-reporter');
        const FirmwareUpdater2 = require('../az-firmware-updater');

        td.when(HubReporter.prototype.sendRestartReport()).thenResolve({});

        const options = {
            restart: function () {
                t.pass("function was called!")
                return Promise.resolve();
            }
        }

        const updater = new FirmwareUpdater2(stubClient(), options);

        updater.restart()
            .then(_ => {
                t.pass("promise was resolved");
            })
            .catch(err => {
                t.fail("should not get here");
            });  
        
        td.reset();
    });

    group.test('if restart option is a function call it and return promise', function (t) {
        t.plan(2);
        
        // something wierd with Test double keeping around reporter module so scoped it here.
        // this is probably not the best way to do this but the td.reset() wasn't working.
        const HubReporter = td.replace('../lib/hub-reporter');
        const FirmwareUpdater2 = require('../az-firmware-updater');

        td.when(HubReporter.prototype.sendRestartReport()).thenResolve({});

        const options = {
            restart: function () {
                t.pass("function was called!");
                return;
            }
        }

        const updater = new FirmwareUpdater2(stubClient(), options);

        updater.restart()
            .then(_ => {
                t.pass("promise was resolved");
            })
            .catch(err => {
                t.fail("should not get here");
            });  
        
        td.reset();
    });

    group.end();
});

function stubClient() {
    return {}
}