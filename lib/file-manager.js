const fs = require('fs');
const decompress = require('decompress');
const crypto = require('crypto');
const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');

module.exports = {
    writeFile: function (file, options) {
        // https://stackoverflow.com/a/14869745
        const fileName = options.fileName || crypto.randomBytes(10).toString('hex');
        const fileLocation = path.join(options.location, fileName);

        return new Promise(function (fulfill, reject) {
            mkdirp(options.location, function (err) {
                if (err) {
                    return reject(err);
                }

                fs.writeFile(fileLocation, file, function (err) {
                    if (err) {
                        return reject(err);
                    }

                    console.log("file saved downloaded");
                    fulfill({ fileLocation: fileLocation, fileName: fileName });
                });
            });
        });
    },

    decompressFiles: function (fileInfo, options) {
        return new Promise(function (fulfill, reject) {
            if (!options.decompress) {
                console.log("skipping decompression.")
                return fulfill(fileInfo.fileLocation);
            }

            const decompressLocation = path.join(options.decompress.location, fileInfo.fileName);

            decompress(fileInfo.fileLocation, decompressLocation, options.decompress)
                .then(files => {
                    console.log("files decompressed.")
                    rimraf(fileInfo.fileLocation, function (err) {
                        if (err) {
                            return reject(err);
                        }

                        console.log("compressed originals removed");
                        return fulfill(decompressLocation);
                    });
                })
                .catch(err => {
                    console.error("unable to unzip: " + err);
                    return reject(err);
                });
        });
    }
}

