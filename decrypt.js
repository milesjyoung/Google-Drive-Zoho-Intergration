const crypto = require('crypto')
const SECRET = "c9b4bb8015bba50bcf3f821000ec547e"

const computeHash = (data, algo = "sha256") => {
    return crypto.createHmac(algo, SECRET).update(data).digest('base64')
}

module.exports = {computeHash}