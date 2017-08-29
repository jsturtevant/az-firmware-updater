const url = require('url');
const downloader = require('./lib/downloader');

module.exports = class FirmwareUpdater {
    constructor(client, options) {
        this.client = client;
        this.options = options;
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

        this.resetFirmwareReport()
            .then(_ => this.download(fwPackageUri))
            .then(fileLocation => this.apply(fileLocation))
            .then(_ => this.restart())
            .then(_ => {
                // complete
                callback();
            })
            .catch(err => {
                console.log(err);
                this.sendErrorReport(err).then(_ => {
                    console.log("error reported.")
                }).catch(err => {
                    // should retry?
                    console.error("Could not send error report.")
                });

                callback(err);
            });
    }

    restart(){
        if (!this.options.restart){
            console.log('restart skipped');
            return Promise.resolve();
        }
        
        if (typeof this.options.restart !== 'function') {
            return Promise.reject('must be function');
        }

        console.log("restarting...");
        const self = this;
        this.sendRestartReport().then(_ => self.options.restart());
    }

    resetFirmwareReport() {
        // setting to null clears in reported property.
        return this.reportFWUpdateThroughTwin(null);
    }

    download(fwPackageUri) {
        return this.sendDownloadingReport()
            .then(_ => downloader.download(fwPackageUri, this.options.downloadOpts))
            .then(fileLocation => {
                this.sendDownloadedReport().then(_ => {
                    return Promise.resolve(fileLocation);
                });
            });
    }

    sendDownloadingReport() {
        return this.reportFWUpdateThroughTwin({
            status: 'downloading',
            startedDownloadingTime: new Date().toISOString()
        })
    }

    sendDownloadedReport() {
        return this.reportFWUpdateThroughTwin({
            status: 'download complete',
            downloadCompleteTime: new Date().toISOString()
        })
    }

    apply(fileLocation) {
        return this.sendApplyingReport()
            .then(_ => this.applyImage(fileLocation))
            .then(_ => this.sendAppliedReport())
    }

    sendApplyingReport() {
        return this.reportFWUpdateThroughTwin({
            status: 'applying',
            startedApplyingImage: new Date().toISOString()
        });
    }

    applyImage(fileLocation) {
        if (!this.options.applyImage || typeof this.options.applyImage !== 'function') {
            return Promise.reject('must be function');
        }

        return this.options.applyImage(fileLocation);
    }

    sendAppliedReport() {
        return this.reportFWUpdateThroughTwin({
            status: 'apply complete',
            lastFirmwareUpdate: new Date().toISOString()
        });
    }

    sendRestartReport() {
        return this.reportFWUpdateThroughTwin({
            status: 'restarting',
            startedRestart: new Date().toISOString()
        });
    }
 

    sendErrorReport(err) {
        return this.reportFWUpdateThroughTwin({
            status: 'error',
            errorMessage: err,
            errorTime: new Date().toISOString()
        });
    }

    reportFWUpdateThroughTwin(firmwareUpdateValue) {
        const self = this;
        const patch = {
            iothubDM: {
                firmwareUpdate: firmwareUpdateValue
            }
        };

        return new Promise(function (fulfill, reject) {
            self.client.getTwin(function (err, twin) {
                if (err) {
                    return reject(err);
                }

                twin.properties.reported.update(patch, function (reportingErr) {
                    if (reportingErr) {
                        return reject(reportingErr);
                    }

                    return fulfill();
                });
            });
        });
    }

}


