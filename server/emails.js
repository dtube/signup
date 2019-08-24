const nodemailer = require('nodemailer')
const aws = require('./aws.js')

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
    send: (recipient, subject, text, htmlText, cb) => {
        if (!emails.validate(recipient)) {
            cb(recipient+' is not a valid email')
            return
        }
        transporter.sendMail({
            from: '"DTube ▶️ Authentication Link" <test@d.tube>', // sender address
            to: recipient, // list of receivers
            subject: subject, // Subject line
            text: text, // plain text body
            html: htmlText // html body
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