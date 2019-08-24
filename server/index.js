const fs = require('fs')
const uuidv1 = require('uuid/v1')
const express = require('express')
const https = require('https')
const http = require('http')
const enforce = require('express-sslify')
const steem = require('steem')
const emails = require('./emails.js')
const captcha = require('./captcha.js')
const sms = require('./sms.js')

const MongoClient = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://localhost:27017';
const mongoDbName = 'signup';

const port = process.env.PORT || 3000
const port_ssl = process.env.PORT || 443
const debug = process.env.DEBUG || false

process.on('SIGINT', function() {
    if (typeof ending !== 'undefined') return
    ending = true
    process.exit()
})

// express server
const app = express()
app.use(express.urlencoded())
app.use(express.json())
app.use(express.static('client',{ dotfiles: 'allow' }))

let db = null
MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, client) {
    if (err) throw err;
    console.log("Connected successfully to database");
    db = client.db(mongoDbName);
    http.createServer(app).listen(port, () => {
        if (!debug) {
            const privateKey = fs.readFileSync('/etc/letsencrypt/live/signup.d.tube/privkey.pem', 'utf8');
            const certificate = fs.readFileSync('/etc/letsencrypt/live/signup.d.tube/cert.pem', 'utf8');
            const ca = fs.readFileSync('/etc/letsencrypt/live/signup.d.tube/chain.pem', 'utf8');
            
            const credentials = {
                key: privateKey,
                cert: certificate,
                ca: ca
            };
        
            console.log('SSL enabled')
            //app.use(enforce.HTTPS({ trustProtoHeader: true }))
            https.createServer(credentials, app).listen(port_ssl, () => {
                console.log(`HTTPS Server listening on port ${port_ssl}!`)
            })
        }  
        console.log(`HTTP Server listening on port ${port}!`)

        // captcha + email verification
        app.post('/', function (req, res) {
            if (!req.body.email || !req.body['h-captcha-response']) {
                res.status(400).send('Bad Request')
                return
            } else {
                captcha.check(req.body['h-captcha-response'], function(err) {
                    if (err) {
                        res.status(503).send('Error verifying captcha')
                        return
                    }
                    console.log(req.body.email)
                    var id = uuidv1()
                    var link = 'http://signup.d.tube:3000/signup/'+id
                    var text = "Claim your dtube account now\nclick on the following link:\n"
                    var htmlText = text.replace('\n','<br/>')
                    text += link
                    htmlText += '<a href="'+link+'">Link</a>'
                    emails.send(req.body.email, 'DTube Signup', text, htmlText, function(err, success) {
                        if (!err) {
                            db.collection('tokens').deleteMany({email: req.body.email}, function(err) {
                                if (err) throw err;
                                db.collection('tokens').insertOne({
                                    _id: id,
                                    email: req.body.email,
                                    ts: new Date().getTime()
                                }, function(err) {
                                    if (err) throw err;
                                    res.redirect('/?ok')
                                })
                            })
                        } else { 
                            console.log(err)
                            res.status(503).send('Error sending email')
                        }
                    })
                })
            }
        })

        // user clicks the email link
        app.get('/signup/:uuid', function (req, res) {
            console.log(req.params.uuid)
            res.send(req.params.uuid)
        })
    })
})
