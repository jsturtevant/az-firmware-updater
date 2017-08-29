exports.initiateUpdate = function (firmwareUpdater) {
    return function (request, response) {
        const packageUrl = request.payload.firmwareUrl;

        if (!firmwareUpdater.isConnectionValid(packageUrl)) {
            response.send(400, 'Invalid connection.  Must use https:// protocol.', printResponseSent);
            return;
        }

        response.send(200, 'Firmware update started.', (err) => {
            if (err) {
                console.error('An error ocurred when sending a method response:\n' + err.toString());
                return;
            }

            firmwareUpdater.initiateFirmwareUpdateFlow(packageUrl, function (err) {
                if (err) {
                    console.log("firmware update failed");
                } else {
                    console.log("Completed firmwareUpdate flow");
                }
            });
        });
    }
}

function printResponseSent(err) {
    if (err) {
        console.error('An error ocurred when sending a method response:\n' + err.toString());
    } else {
        console.log('Response to method sent successfully.');
    }
}