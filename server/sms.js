const aws = require('./aws.js')
const sns = new aws.SNS({region: "eu-west-1"})
const config = require('./config.js')

var sms = {
    sent: [],
    send: (phoneNumber, message, ip, cb) => {
        if (phoneNumber.split('+').length > 2)
            phoneNumber = '+' + phoneNumber.split('+')[phoneNumber.split('+').length - 1]
        
        if (sms.limited(phoneNumber, ip)) {
            cb('Maximum rate limit exceeded. Please wait a few hours and try again.')
            return
        }
        sns.publish({
            Message: message,
            PhoneNumber: phoneNumber
        }, function(err, result) {
            if (!err) {
                cb()
                sms.sent.push({
                    phoneNumber: phoneNumber,
                    ts: new Date().getTime(),
                    ip: ip
                })
            }
        })
    },
    limited: (phoneNumber, ip) => {
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