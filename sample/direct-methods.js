exports.initiateUpdate = function (firmwareUpdater) {
    return function (request, response) {
        printDeviceMethodRequest(request);

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

function printDeviceMethodRequest(request) {
    // print method name
    console.log('Received method call for method \'' + request.methodName + '\'');

    // if there's a payload just do a default console log on it
    if (request.payload) {
        console.log('Payload:\n' + request.payload);
    }
}

function printResponseSent(err) {
    if (err) {
        console.error('An error ocurred when sending a method response:\n' + err.toString());
    } else {
        console.log('Response to method sent successfully.');
    }
}