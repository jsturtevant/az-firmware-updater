const test = require('tape');
const HubReporter = require('../lib/hub-reporter');

test('hub-reporter-tests', function (group) {
    group.test('if getting twin fails return error', function (t) {
        t.plan(1);

        const clientStub = {
            getTwin: function (callback) {
                return callback("failed to get twin");
            }
        }

        const reporter = new HubReporter(clientStub);

        reporter.reportFirmwareUpdate({}).catch(err => {
            t.equal(err, "failed to get twin");
        });
    });

    group.test('if twin update fails return error', function (t) {
        t.plan(1);

        const client = stubClient(function (patch, callback) {
            callback("failed to update")
        });

        const reporter = new HubReporter(client);

        reporter.reportFirmwareUpdate({}).catch(err => {
            t.equal(err, "failed to update");
        })
    });

    group.test('twin update should pass along the value wrapped in object', function (t) {
        t.plan(2);

        const firmwareUpdateValue = {
            status: "start"
        }

        const client = stubClient(function (patch, callback) {
            const expected = {
                firmwareUpdate: firmwareUpdateValue
            }
            t.same(patch, expected);
            callback(null);
        });

        const reporter = new HubReporter(client);

        reporter.reportFirmwareUpdate(firmwareUpdateValue)
            .then(_ => {
                t.pass("should get here!");
            })
            .catch(err => {
                t.fail("should not get here")
            })
    });

    group.end();
});

function stubClient(updateFunction) {
    return clientStub = {
        getTwin: function (callback) {
            return callback(null, {
                properties: {
                    reported: {
                        update: updateFunction
                    }
                }
            });
        }
    }
}