const nodemailer = require('nodemailer')

// let transporter = nodemailer.createTransport({
//     sendmail: true
// });
let transporter = nodemailer.createTransport({
    host: "smtp.free.fr",
    port: 25,
    secure: false
});

var emails = {
    send: (recipient, subject, text, htmlText, cb) => {
        transporter.sendMail({
            from: '"Test DTube 👻" <test@d.tube>', // sender address
            to: recipient, // list of receivers
            subject: subject, // Subject line
            text: text, // plain text body
            html: htmlText // html body
        }, function(err, res) {
            if (err) cb(err)
            else cb(null, res)
        });
    },
    validate: () => {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        return re.test(email)
    }
}

module.exports = emails