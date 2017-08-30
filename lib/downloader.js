const fs = require('fs');
const url = require('url');
const https = require('https');
const decompress = require('decompress');
const crypto = require('crypto');
const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');


module.exports = {
    download: function (uriToFile, options) {
        return downloadFirmware(uriToFile, options)
            .then(file => writeFile(file, options))
            .then(fileInfo => decompressFiles(fileInfo, options));

    }
}

// using pattern as described here http://hassansin.github.io/certificate-pinning-in-nodejs
function downloadFirmware(uriToFile, options = {}) {
    const parsedUri = url.parse(uriToFile);

    var requestInfo = {
        hostname: parsedUri.hostname,
        port: 443,
        path: parsedUri.path,
        method: 'GET',
        //disable session caching
        agent: new https.Agent({
            maxCachedSessions: 0
        })
    };

    return new Promise(function (fulfill, reject) {

        var req = https.get(requestInfo, res => {
            const reportedchecksum = res.headers["content-md5"];
            console.log(`checksum given: \t${reportedchecksum}`);

            let rawChunks = [];
            let hash = crypto.createHash('md5');
            res.on('data', chunk => {
                rawChunks.push(chunk);
                hash.update(chunk, 'utf8')
            });

            res.on('end', function () {
                const calculatedChecksum = hash.digest('base64');
                console.log(`checksum calculated: \t${calculatedChecksum}.`)
                if (calculatedChecksum !== reportedchecksum) {
                    return reject("checksum is invalid");
                }

                var file = Buffer.concat(rawChunks);
                fulfill(file);
            });
        }).on('error', e => {
            console.error(e);
            reject(e);
        });

        req.on('socket', socket => {
            socket.on('secureConnect', () => {
                var fingerprint = socket.getPeerCertificate().fingerprint;

                // Check if certificate is valid
                if (socket.authorized === false) {
                    req.emit('error', new Error(socket.authorizationError));
                    req.abort();
                    return reject(e);
                }

                // Match the fingerprint with our saved fingerprints
                if (options.fingerPrintSet && options.fingerPrintSet.indexOf(fingerprint) === -1) {
                    const err = new Error('Fingerprint does not match');
                    // Abort request, optionally emit an error event
                    req.emit('error', err);
                    req.abort();
                    return reject(err);
                }
            });
        });

        req.end();
    });

}

function writeFile(file, options) {
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
}

function decompressFiles(fileInfo, options) {
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