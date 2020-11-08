var bs58 = require('bs58')
var secp256k1 = require('secp256k1')

module.exports = {
    verifyLogin: (tx, cb) => {
        javalon.getAccount(tx.sender, function(err, sender) {
            if (err) return
            if (!sender || !sender.pub) return
            var allowedPubKeys = [sender.pub]
            if (sender.keys)
                for (let i = 0; i < sender.keys.length; i++) 
                    allowedPubKeys.push(sender.keys[i].pub)
            for (let i = 0; i < allowedPubKeys.length; i++) {
                var bufferHash = Buffer.from(tx.hash, 'hex')
                var b58sign = bs58.decode(tx.signature)
                var b58pub = bs58.decode(allowedPubKeys[i])
                if (secp256k1.ecdsaVerify(b58sign, bufferHash, b58pub)) {
                    cb(true)
                }
            }
            cb(false)
        })
    }
}