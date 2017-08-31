![build status](https://jsturtevant.visualstudio.com/_apis/public/build/definitions/45b608fa-8cc0-476d-8c5c-999525e4924c/13/badge)

# Azure IoT Firmware Updater
Helps simplify the work needed to control the process flow for updating firmware in node.js when using Azure IoT Hub

`npm install az-firmware-updater`

## Getting started
You will need an existing Azure IoT Hub.  

To use the firmware updater on your client device (see [samples](./sample) for a complete solution):

```javascript
const Protocol = require('azure-iot-device-mqtt').Mqtt;
const Client = require('azure-iot-device').Client;
const FirmwareUpdater = require('az-firmware-updater');

const client = Client.fromConnectionString('your-connection-string', Protocol);

client.open(function (err) {
    if (err) {
        console.log(`client error: ${err}`);
    } else {
        console.log('client connected.');

        const options = {
            applyImage: function (imageName) {
                return new Promise(function (fulfill, reject) {

                    // put your custom apply logic here.
                    setTimeout(function () {
                        console.log(`Applied the image: ${imageName}`);
                        fulfill();
                    }, 4000);
                });
            }
        }
        const firmwareUpdater = new FirmwareUpdater(client, options);
        
        client.onDeviceMethod('firmwareUpdate', function (request, response) {
            response.send(200, 'Firmware update started.');

            firmwareUpdater.initiateFirmwareUpdateFlow(request.payload.firmwareUrl, function (err) {
                if (err) {
                    console.log("firmware update failed");
                } else {
                    console.log("Completed firmwareUpdate flow");
                }
            });
        });
    }
});
```

