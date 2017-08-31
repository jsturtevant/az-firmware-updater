const url = require('url');
const downloader = require('./lib/downloader');
const HubReporter = require('./lib/hub-reporter');
const rimraf = require('rimraf');
const os = require('os');
const path = require('path');


module.exports = class FirmwareUpdater {
    constructor(client, options) {
        this.hubReporter = new HubReporter(client);

        const defaultOptions = {
            downloadOpts: {
                location: path.join(os.homedir(), ".azfirmware"),
                decompress: {
                    location: path.join(os.homedir(), ".azfirmware\\uncompressed")
                }
            },
        };

        this.options = Object.assign({}, defaultOptions, options);;
    }

    isConnectionValid(fwPackageUri = "") {
        const fwPackageUriObj = url.parse(fwPackageUri);

        // Ensure that the url is to a secure url
        if (fwPackageUriObj.protocol !== 'https:') {
            return false;
        }

        return true;
    }

    initiateFirmwareUpdateFlow(fwPackageUri, callback) {
        console.log("firmware upgrade started")

        let currentLocation;
        this.hubReporter.resetFirmwareReport()
            .then(_ => this.download(fwPackageUri))
            .then(fileLocation => {
                currentLocation = fileLocation;
                return this.apply(fileLocation);
            })
            .then(_ => this.restart())
            .then(_ => this.cleanup(currentLocation))
            .then(_ => {
                // complete
                callback();
            })
            .catch(err => {
                console.log(err);
                this.hubReporter.sendErrorReport(err).then(_ => {
                    console.log("error reported.")
                }).catch(err => {
                    // should retry?
                    console.error("Could not send error report.")
                });

                callback(err);
            });
    }

    restart() {
        if (!this.options.restart) {
            console.log('restart skipped');
            return Promise.resolve();
        }

        if (typeof this.options.restart !== 'function') {
            return Promise.reject('restart option must be function');
        }

        console.log("restarting...");
        const self = this;
        return this.hubReporter.sendRestartReport()
            .then(_ => self.options.restart());
    }

    cleanup(fileLocation) {
        if (!this.options.cleanup) {
            console.log("cleanup skipped. you are responsible for cleaning up firmware files.")
            return Promise.resolve();
        }

        return new Promise(function (fulfill, reject) {
            rimraf(fileLocation, function (err) {
                if (err) {
                    return reject(err);
                }

                console.log("all files removed");
                fulfill();
            });
        });
    }

    download(fwPackageUri) {
        return this.hubReporter.sendDownloadingReport()
            .then(_ => downloader(fwPackageUri, this.options.downloadOpts))
            .then(fileLocation => {
                return this.hubReporter.sendDownloadedReport().then(_ => {
                    return Promise.resolve(fileLocation);
                });
            });
    }

    apply(fileLocation) {
        return this.hubReporter.sendApplyingReport()
            .then(_ => this.applyImage(fileLocation))
            .then(_ => this.hubReporter.sendAppliedReport())
    }

    applyImage(fileLocation) {
        if (!this.options.applyImage || typeof this.options.applyImage !== 'function') {
            return Promise.reject('applyImage option must be function');
        }

        const result = this.options.applyImage(fileLocation);

        if (Promise.resolve(result) == result) {
            return result;
        } else {
            return Promise.resolve(result);
        }
    }
}


