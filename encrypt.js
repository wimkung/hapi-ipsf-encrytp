const zlib = require('zlib');
const crypto = require('crypto');
const stream = require('stream');
const gatherStream = require('gather-stream');

const AppendInitVect = require('./appendInitVect');
const getCipherKey = require('./getCipherKey');

module.exports = async ({ data, password }) => {
  // Generate a secure, pseudo random initialization vector.
  const initVect = crypto.randomBytes(16);

  // Generate a cipher key from the password.
  const CIPHER_KEY = getCipherKey(password);
  const gzipStream = zlib.createGzip();
  const cipher = crypto.createCipheriv('aes-256-cbc', CIPHER_KEY, initVect);
  const appendInitVect = new AppendInitVect(initVect);
  const readStream = new stream.PassThrough();
  readStream.end(data);

  return new Promise(((resolve, reject) => {
      stream.pipeline(
        readStream,
        gzipStream,
        cipher,
        appendInitVect,
        gatherStream((error,buffer) => {
            if (error) reject(error);
            resolve(buffer);
          }
        )
      )
    })
  );

}