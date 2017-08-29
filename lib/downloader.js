const fs = require('fs');
const url = require('url');
const https = require('https');
const decompress = require('decompress');
const crypto = require('crypto');
const path = require('path');
const stream = require('stream');


module.exports = {
    // using pattern as described here http://hassansin.github.io/certificate-pinning-in-nodejs
    download: function (uriToFile, options) {
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
                const md5checksum = res.headers["content-md5"];
                console.log(`checksum given is ${md5checksum}`);

                res.on('data', d => {
                    //TODO think about cleaning up the files.

                    // https://stackoverflow.com/a/14869745
                    const fileName = options.fileName || crypto.randomBytes(10).toString('hex');
                    const fileLocation = path.join(options.location, fileName);

                    fs.writeFile(fileLocation, d, function (err) {
                        if (err) {
                            console.error("writefile: " + err);
                            return reject(err);
                        }

                        console.log("The file was downloaded.  checking checksum");
                        checksum(fileLocation, md5checksum).then(isValid => {
                            if (!isValid) {
                               return reject("checksum is invalid");
                            }

                            if (options.decompress) {
                                console.log("files will be unzipped.")
                                
                                const decompressLocation = path.join(options.decompress.location, fileName);
                                decompress(fileLocation, decompressLocation, options.decompress)
                                .then(files => {
                                    console.log("files unzipped.")
                                    return fulfill(options.saveLocation + '/unzipped');
                                })
                                .catch(err => {
                                    console.error("unable to unzip: " + err);
                                    return reject(err);
                                });
                            } else {
                                fulfill(options.saveLocation);
                            }
                        }).catch(err => {
                            return reject(err);
                        })
                    });
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
                    if (options.fingerPrintSet.indexOf(fingerprint) === -1) {
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
}

function checksum(filePath, checksumToCheck) {
    return new Promise(function (fulfill, reject) {
        let hash = crypto.createHash('md5'),
            stream = fs.createReadStream(filePath);

        stream.on('data', function (data) {
            hash.update(data, 'utf8')
        });

        stream.on('error', err => {
            reject(err);
        });

        stream.on('end', function () {
            const result = hash.digest('base64'); 
            console.log(`calculated checksum is ${result}.`)
            fulfill(result === checksumToCheck);
        });
    });
}