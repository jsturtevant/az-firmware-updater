module.exports = class HubReporter {
    constructor(client) {
        this.client = client;
    }

    reportFirmwareUpdate(firmwareUpdateValue) {
        const self = this;
        const patch = {
            firmwareUpdate: JSON.stringify(firmwareUpdateValue)
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

    sendDownloadingReport() {
        return  this.reportFirmwareUpdate({
            status: 'downloading',
            startedDownloadingTime: new Date().toISOString()
        })
    }

    sendDownloadedReport() {
        return   this.reportFirmwareUpdate({
            status: 'download complete',
            downloadCompleteTime: new Date().toISOString()
        })
    }

    sendApplyingReport() {
        return   this.reportFirmwareUpdate({
            status: 'applying',
            startedApplyingImage: new Date().toISOString()
        });
    }

    
    sendAppliedReport() {
        return   this.reportFirmwareUpdate({
            status: 'apply complete',
            lastFirmwareUpdate: new Date().toISOString()
        });
    }

    sendRestartReport() {
        return   this.reportFirmwareUpdate({
            status: 'restarting',
            startedRestart: new Date().toISOString()
        });
    }
 
    sendErrorReport(err) {
        return   this.reportFirmwareUpdate({
            status: 'error',
            errorMessage: err,
            errorTime: new Date().toISOString()
        });
    }

    resetFirmwareReport() {
        // setting to null clears in reported property.
        return  this.reportFirmwareUpdate(null);
    }

}

