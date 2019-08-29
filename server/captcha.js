const axios = require('axios')
const qs = require('qs')
const config = require('./config.js')
var captcha = {
    check: (token, cb) => {
        if (!token) {
            cb(true)
            return
        }
        var data = {
            response: token,
            secret: config.hcaptchaSecret
        }
        var url = 'https://hcaptcha.com/siteverify'
        var options = {
            method: 'POST',
            timeout: 2500,
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data: qs.stringify(data),
            url,
        }
        axios(options, JSON.stringify(data))
        .then((data) => {
            if (!data || !data.data) {
                cb(true)
                return
            }
            var captcha = data.data
            if (!captcha.success) {
                cb(true)
                return
            }
            cb()
        })
        .catch((error) => {
            cb(error.data)
        })
    }
}

module.exports = captcha