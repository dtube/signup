const aws = require('./aws.js')
const sns = new aws.SNS({region: "eu-west-1"})

let plivo = require('plivo');
let plivo_client = new plivo.Client();
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

        var phoneNumberExtension = parseInt(phoneNumber.split(' ')[0].replace('+',''))

        if (config.smsAllowedCountries.indexOf(phoneNumberExtension) == -1) {
            cb('Your country (+'+phoneNumberExtension+') is not available for SMS verification')
            return
        }
        
        var ourPhoneNumber = '+1 415-349-5620'
        plivo_client.messages.create(
            ourPhoneNumber,
            phoneNumber,
            message
        ).then(function(message_created) {
            cb()
            console.log('sent sms to '+phoneNumber)
            sms.sent.push({
                phoneNumber: phoneNumber,
                ts: new Date().getTime(),
                ip: ip
            })
        }).catch(function(err) {
            console.log(err)
            cb('Error sending SMS to '+phoneNumber)
            return
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