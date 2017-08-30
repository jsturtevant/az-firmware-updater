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
        })
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