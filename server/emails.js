const nodemailer = require('nodemailer')
const aws = require('./aws.js')
const config = require('./config.js')

// let transporter = nodemailer.createTransport({
//     sendmail: true
// });
let transporter = nodemailer.createTransport({
    SES: new aws.SES({region: "eu-west-1"})
});
// let transporter = nodemailer.createTransport({
//     host: "smtp.free.fr",
//     port: 25,
//     secure: false
// });

var emails = {
    send: (recipient, subject, uuid, cb) => {
        if (!emails.validate(recipient)) {
            cb(recipient+' is not a valid email')
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
            else cb(null, res)
        });
    },
    validate: (recipient) => {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        return re.test(recipient)
    }
}

module.exports = emails