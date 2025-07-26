const crypto = require('crypto')
const SECRET = "your secret (or use secret manager)"

const computeHash = (data, algo = "sha256") => {
    return crypto.createHmac(algo, SECRET).update(data).digest('base64')
}

module.exports = {computeHash}