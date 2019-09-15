const aws = require('./aws.js')
const sns = new aws.SNS({region: "eu-west-1"})

var sms = {
    sent: [],
    send: (phoneNumber, message, ip, cb) => {
        if (sms.limited(phoneNumber, ip)) {
            cb('Maximum rate limit exceeded. Please wait and try again.')
            return
        }
        sns.publish({
            Message: message,
            PhoneNumber: phoneNumber
        }, function(err, result) {
            if (!err) {
                sms.sent.push({
                    phoneNumber: phoneNumber,
                    ts: new Date().getTime(),
                    ip: ip
                })
            }
        })
    },
    limited: (recipient, ip) => {
        var countRecipient = 0
        var countIp = 0
        for (let i = sms.sent.length-1; i >= 0; i--) {
            if (sms.sent[i].phoneNumber == phoneNumber)
                countRecipient++
            if (sms.sent[i].ip == ip)
                countIp++
        }

        if (countRecipient >= config.limits.smsCount || countIp >= config.limits.smsCount)
            return true

        return false
    },
    purge: () => {
        for (let i = sms.sent.length-1; i >= 0; i--) {
            if (sms.sent[i].ts < new Date().getTime() - config.limits.smsPeriod)
                sms.sent.splice(i, 1)
        }
    }
}

setInterval(function() {
    sms.purge();
}, 1000*60)


module.exports = sms