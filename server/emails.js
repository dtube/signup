const nodemailer = require('nodemailer')
const aws = require('./aws.js')
const config = require('./config.js')

let transporter = nodemailer.createTransport({
    SES: new aws.SES({region: "eu-west-1"})
});

var emails = {
    sent: [],
    send: (recipient, subject, uuid, ip, cb) => {
        if (!emails.validate(recipient)) {
            cb(recipient+' is not a valid email')
            return
        }
        if (emails.limited(recipient, ip)) {
            cb('Maximum rate limit exceeded. Please wait a few minutes and try again.')
            return
        }
        var link = config.protocol+config.domain+'/?uuid='+uuid
        var text = "Claim your dtube account now\nclick on the following link:\n"
        var htmlText = text.replace('\n','<br/>')
        text += link
        htmlText += '<a href="'+link+'">'+link+'</a>'
        transporter.sendMail({
            from: '"DTube ▶️ Authentication Link" <test@d.tube>',
            to: recipient,
            subject: subject,
            text: text,
            html: htmlText
        }, function(err, res) {
            if (err) cb(err)
            else {
                cb(null, res)
                emails.sent.push({
                    recipient: recipient,
                    ts: new Date().getTime(),
                    ip: ip
                })
            }
        });
    },
    sendContact: (recipient, subject, text, ip, cb) => {
        if (recipient.split('@')[1] !== 'd.tube')  {
            cb('A contact email requires a @d.tube recipient.')
            return
        }
        var htmlText = text.replace('\n','<br/>')
        transporter.sendMail({
            from: '"DTube Bot" <no-reply@d.tube>',
            to: recipient,
            subject: subject,
            text: text,
            html: htmlText
        }, function(err, res) {
            if (err) cb(err)
            else cb(null, res)
        });
    },
    validate: (recipient) => {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        return re.test(recipient)
    },
    limited: (recipient, ip) => {
        var countRecipient = 0
        var countIp = 0
        for (let i = emails.sent.length-1; i >= 0; i--) {
            if (emails.sent[i].recipient == recipient)
                countRecipient++
            if (emails.sent[i].ip == ip)
                countIp++
        }

        if (countRecipient >= config.limits.emailCount || countIp >= config.limits.emailCount)
            return true

        return false
    },
    purge: () => {
        for (let i = emails.sent.length-1; i >= 0; i--) {
            if (emails.sent[i].ts < new Date().getTime() - config.limits.emailPeriod)
                emails.sent.splice(i, 1)
        }
    }
}

setInterval(function() {
    emails.purge();
}, 1000*60)

module.exports = emails