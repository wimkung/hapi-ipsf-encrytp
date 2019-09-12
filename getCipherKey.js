const crypto = require('crypto');

module.exports = password => {
  return crypto.createHash('sha256').update(password).digest();
}