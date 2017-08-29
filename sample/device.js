'use strict';

const Protocol = require('azure-iot-device-mqtt').Mqtt;
const Client = require('azure-iot-device').Client;
const methods = require('./direct-methods');
const FirmwareUpdater = require('../az-firmware-updater');

const connString = process.argv[2] || process.env.connectionString;

// Create IoT Hub client
const client = Client.fromConnectionString(connString, Protocol);

const connect = function (err) {
    if (err) {
        console.log(`client error: ${err}`);
    } else {
        console.log('client connected.');

        const options = {
            downloadOpts: {
                fingerPrintSet: [
                    '49:DC:39:67:1C:5B:8C:C3:08:0F:77:5A:07:C2:BE:A5:B4:D9:DA:1A'
                ],
                location: 'C:\\temp\\updates\\',
                decompress: {
                    location: 'C:\\temp\\updates\\unzipped\\'
                }
            },
            applyImage: function (imageName) {
                return new Promise(function (fulfill, reject) {
                    setTimeout(function () {
                        console.log(`Applied. ${imageName}`);
                        fulfill();
                    }, 4000);
                });
            },
            restart: function(){
                process.exit();
            }
        }

        const firmwareUpdater = new FirmwareUpdater(client, options);
        client.onDeviceMethod('firmwareUpdate', methods.initiateUpdate(firmwareUpdater));

        // handle disconnect and errors.
        client.on('error', function (err) {
            console.log(`client error: ${err}`);
        });

        client.on('disconnect', function () {
            console.log('disconnected');
            client.removeAllListeners();
            client.open(connect);
        });
    }
}

client.open(connect);