const zlib = require('zlib');
const crypto = require('crypto');
const stream = require('stream');
const gatherStream = require('gather-stream');

const getCipherKey = require('./getCipherKey');

module.exports = async ({ rawStream, password }) => {
  const rawBuffer = await new Promise((resolve, reject) => {
    stream.pipeline(
      rawStream,
      gatherStream((error, buffer) => {
          if (error) reject(error);
          resolve(buffer);
        }
      )
    )
  });
  const initVect = rawBuffer.slice(0, 16);

  // // Once we’ve got the initialization vector, we can decrypt the file.
  const unzip = zlib.createUnzip();
  const cipherKey = getCipherKey(password);
  const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, initVect);
  const fileStream = new stream.PassThrough();
  fileStream.end(rawBuffer.slice(16));

  return new Promise((resolve, reject) => {
    stream.pipeline(
      fileStream,
      decipher,
      unzip,
      gatherStream((error, buffer) => {
          if (error) reject(error);
          resolve(buffer);
        }
      )
    )
  });
}