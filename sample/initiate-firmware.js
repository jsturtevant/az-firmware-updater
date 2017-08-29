const Client = require('azure-iothub').Client;

const deviceId = process.argv[2];
const connString = process.argv[3] || process.env.connectionString;

const client = Client.fromConnectionString(connString);

const method = {
    methodName: "firmwareUpdate",
    payload: {
        firmwareUrl: '<your firmware package url>'
    },
    timeoutInSeconds: 30
};

client.invokeDeviceMethod(deviceId, method, function (err, result) {
    if (err) {
        console.error('Could not start the firmware update on the device: ' + err.message)
    }

    console.log(result);
});