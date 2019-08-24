const aws = require('./aws.js')
const sns = new aws.SNS({region: "eu-west-1"})

var sms = {
    send: (phoneNumber, message, cb) => {
        sns.publish({
            Message: message,
            PhoneNumber: phoneNumber
        }, function(err, result) {
            console.log(err, result)
        })
    }
}

module.exports = sms