const url = require('url');
const https = require('https');
const crypto = require('crypto');
const path = require('path');
const fileManager = require('./file-manager');

module.exports = function (uriToFile, options) {
    return downloadFirmware(uriToFile, options)
        .then(file => fileManager.writeFile(file, options))
        .then(fileInfo => fileManager.decompressFiles(fileInfo, options));
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
