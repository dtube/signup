const config = require('./config.js')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const moment = require('moment')
const express = require('express')
const helmet = require('helmet')
const https = require('https')
const http = require('http')
const enforce = require('express-sslify')
const steem = require('steem')
javalon = require('javalon')
const axios = require('axios')
const emails = require('./emails.js')
const captcha = require('./captcha.js')
const sms = require('./sms.js')
const fb = require('./facebook.js')
const usernameValidation = require('./username_validation.js')
const steemStreamer = require('./steemStreamer.js')
const cors = require('cors')

javalon.init({api: config.avalon.api})

var coinbase = require('coinbase-commerce-node')
var Client = coinbase.Client
Client.init(config.coinbase.apiKey)
var Charge = coinbase.resources.Charge
var Webhook = coinbase.Webhook

const MongoClient = require('mongodb').MongoClient
const mongoUrl = 'mongodb://localhost:27017'
const mongoDbName = 'signup'

const port = process.env.PORT || 3000
const port_ssl = process.env.PORT_SSL || 443
const debug = process.env.DEBUG || false

let STEEM_USD = 0.155
let STEEM_DTC = 0.1/(STEEM_USD)

process.on('SIGINT', function() {
    if (typeof ending !== 'undefined') return
    ending = true
    process.exit()
})

// airdrop list
airdropList = {}
airdroppedList = {}
fs.readFile('./airdropped.csv', function(err, data) {
    var tmp = data.toString('utf8').split('\n')
    for (let i = 0; i < tmp.length; i++)
        airdroppedList[tmp[i].split(',')[0]] = tmp[i].split(',')[1]
    delete tmp
    console.log('Loaded '+Object.keys(airdroppedList).length+' claims for airdrop')
    // console.log(airdroppedList)
    fs.readFile('./airdrop.csv', function(err, data) {
        var tmp = data.toString('utf8').split('\n')
        for (let i = 0; i < tmp.length; i++)
            airdropList[tmp[i].split(',')[0]] = tmp[i].split(',')[1]
        delete tmp
        console.log('Loaded '+Object.keys(airdropList).length+' recipients for airdrop')
        // console.log(airdropList)
    })
})


// express server
const app = express()
app.use(helmet())
app.set('env', 'production')
app.use(express.urlencoded())
app.use(express.json())
app.use(express.static('client',{ dotfiles: 'allow' }))
app.use(fb.initialize())
app.use(fb.session())
app.enable('trust proxy')

db = null
MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function(err, client) {
    if (err) throw err;
    console.log("Connected successfully to database");
    db = client.db(mongoDbName);
    if (config.steemStreamer)
        steemStreamer.start(db)

    // mailing list
    // setInterval(function() {
    //     db.collection('account').findOne({
    //         optin: true,
    //         mainnet: {$exists: false}
    //     }, function(err, res) {
    //         if (err) throw err
    //         if (res) {
    //             emails.sendNews(res.email, function(err, result) {
    //                 if (err) console.log('ERROR: ',err)
    //                 else {
    //                     db.collection('account').updateOne({email: res.email}, {$set: {mainnet: true}})
    //                 }
    //             })
    //         } else console.log('No more email to send for mainnet email')
    //     })
    // }, 3000)
    http.createServer(app).listen(port, '::1', () => {
        if (config.ssl) {
            const privateKey = fs.readFileSync('/etc/letsencrypt/live/'+config.domain+'/privkey.pem', 'utf8');
            const certificate = fs.readFileSync('/etc/letsencrypt/live/'+config.domain+'/cert.pem', 'utf8');
            const ca = fs.readFileSync('/etc/letsencrypt/live/'+config.domain+'/chain.pem', 'utf8');
            
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

        // app.get('/debug', function (req, res) {
        //     var debug = {
        //         email: emails.sent,
        //         sms: sms.sent
        //     }
        //     res.send(debug)
        // })

        app.get('/airdrop-eligible/:username', cors(), function (req, res) {
            let username = req.params.username
            if (airdropList[username]) {
                var amount = Math.floor(100*parseFloat(airdropList[username])/6)
                res.send({eligible: amount})
            }
            else
                res.send({eligible: false})
        })

        // notice next round
        app.post('/alertNextRound', function (req, res) {
            if (!req.body.email || !emails.validate(req.body.email)) {
                res.send({ok: false})
                return
            }
            db.collection('next_round_alert').insertOne({
                email: req.body.email
            })
            res.send({ok: 1})
        })

        // captcha + email verification
        app.post('/contact', function (req, res) {
            if (!req.body.email || !req.body['h-captcha-response'] || !req.body.text || !req.body.subject) {
                res.redirect('/?error=Missing Data')
                return
            }
            captcha.check(req.body['h-captcha-response'], function(err) {
                if (err) {
                    res.status(400).send('Error verifying captcha')
                    return
                }
                var ip_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
                emails.sendContact(req.body.email, req.body.subject, req.body.text, ip_addr, function(err, success) {
                    if (!err) {
                        res.redirect('/?ok')
                    } else {
                        res.status(400).send(err)
                    }
                })
            })
        })

        // captcha + email verification
        app.post('/', function (req, res) {
            if (!req.body.email || !req.body['g-recaptcha-response'] || !req.body.birth) {
                res.redirect('/?error=Missing Data')
                return
            }
            var years = moment().diff(req.body.birth, 'years')
            if (years < 13) {
                res.redirect('/?kid')
                return
            }
            if (years > 120) {
                res.redirect('/?error=Invalid Birth Date')
                return
            }
            captcha.check(req.body['g-recaptcha-response'], function(err) {
                if (err) {
                    res.status(400).send('Error verifying captcha')
                    return
                }
                var uuid = uuidv4()
                var ip_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
                let realRecipient = emails.removeEmailTricks(req.body.email)                
                emails.send(realRecipient, req.body.email, 'DTube Signup', uuid, ip_addr, function(err, success) {
                    if (!err) {
                        var acc = {
                            _id: uuid,
                            email: realRecipient,
                            birth: req.body.birth,
                            ts: new Date().getTime()
                        }
                        if (req.body.email !== realRecipient)
                            acc.emailInput = req.body.email

                        if (req.query.ref)
                            acc.ref = req.query.ref

                        db.collection('tokens').insertOne(acc, function(err) {
                            if (err) throw err;
                            res.redirect('/?ok')
                        })
                    } else {
                        res.status(400).send(err)
                    }
                })
            })
        })

        // user clicks the email link
        app.get('/signup/:uuid', function (req, res) {
            verifToken(req, res, function(token) {
                if (!token) return
                db.collection('account').findOne({email: token.email}, function(err, acc) {
                    if (err) {
                        res.status(400).send('Database error')
                        return
                    }
                    if (!acc) {
                        var acc = {
                            email: token.email,
                            birth: token.birth,
                            startTime: new Date().getTime(),
                            ref: token.ref
                        }
                        if (token.emailInput)
                            acc.emailInput = token.emailInput
                        
                        db.collection('account').insertOne(acc)
                        res.send(acc)
                    } else
                        res.send(acc)
                })
            })
        })

        // user submits personal info
        app.post('/personalInfo/:uuid', function (req, res) {
            if (!req.params.uuid || !req.body.personal_info) {
                res.status(400).send('Missing information')
                return
            }
            var info = req.body.personal_info
            if (!info.postal || !info.country) {
                res.status(400).send('Missing information')
                return
            }
            verifToken(req, res, function(token) {
                if (!token) return
                db.collection('account').updateOne({email: token.email}, {
                    $set: {personal_info: req.body.personal_info}
                }, function() {
                    res.send()
                })
            })
        })

        // facebook connect
        app.get('/skipFb/:uuid', function(req, res) {
            if (!req.params.uuid) {
                res.status(400).send('Missing information')
                return
            }
            verifToken(req, res, function(token) {
                if (!token) return

                db.collection('account').updateOne({email: token.email}, {
                    $set: {facebook: 'skip'}
                }, function() {
                    res.send()
                })
            })
        })

        app.get('/auth/facebook',
            fb.authenticate('facebook')
        );
        
        app.get('/auth/facebook/callback',
        fb.authenticate('facebook', { failureRedirect: '/?fberror=1' }),
        function(req, res) {
            // Successful authentication, redirect home.
            res.redirect('/?fb='+req.user.accessToken);
        });

        app.get('/linkFacebook/:token/:uuid', function(req, res) {
            if (!req.params.token || !req.params.uuid) {
                res.status(400).send('Missing information')
                return
            }
            verifToken(req, res, function(token) {
                if (!token) return

                db.collection('facebook').findOne({accessToken: req.params.token}, function(err, facebook) {
                    if (!facebook) {
                        res.status(400).send('Error linking facebook')
                        return
                    }
                    db.collection('account').findOne({"facebook.profile.id": facebook.profile.id}, function(err, acc) {
                        if (acc) {
                            res.status(400).send('Facebook account already used')
                            return
                        }
                        db.collection('account').updateOne({email: token.email}, {
                            $set: {facebook: facebook}
                        }, function() {
                            res.send()
                        })
                    })
                })
            })
        })

        app.get('/skipSms/:uuid', function(req, res) {
            if (!req.params.uuid) {
                res.status(400).send('Missing information')
                return
            }
            verifToken(req, res, function(token) {
                if (!token) return

                db.collection('account').updateOne({email: token.email}, {
                    $set: {phone: 'skip'}
                }, function() {
                    res.send()
                })
            })
        })

        // user submits phone number, we send a code
        app.post('/smsCode/:uuid', function (req, res) {
            if (!req.params.uuid || !req.body.phone) {
                res.status(400).send('Missing information')
                return
            }
            verifToken(req, res, function(token) {
                if (!token) return

                var code = Math.floor(100000+Math.random()*900000)
                db.collection('phone').deleteMany({
                    phone: req.body.phone
                }, function() {
                    db.collection('phone').insertOne({
                        phone: req.body.phone,
                        code: code,
                        ts: new Date().getTime(),
                        attempts: 0
                    })
                })
                var message = 'Verification code: '+code+'. Make sure the domain in your address bar is \'d.tube\' before proceeding.'
                var ip_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
                sms.send(req.body.phone, message, ip_addr, function(err) {
                    if (err) {
                        res.status(429).send(err)
                    }
                    res.send()
                })
                
            })
        })

        // user submits the code he received
        app.post('/smsVerify/:uuid', function(req, res) {
            if (!req.params.uuid || !req.body.code || !req.body.phone) {
                res.status(400).send('Missing information')
                return
            }
            verifToken(req, res, function(token) {
                if (!token) return
                
                db.collection('phone').findOne({
                    phone: req.body.phone,
                    code: parseInt(req.body.code)
                }, function(err, phone) {
                    if (!phone) {
                        // not verified !!
                        db.collection('phone').findOne({
                            phone: req.body.phone
                        }, function(err, phone) {
                            if (phone) {
                                if (phone.attempts < config.limits.smsCodeAttempts-1) {
                                    db.collection('phone').updateOne({
                                        phone: req.body.phone
                                    }, {
                                        "$inc": {attempts: 1}
                                    }, function() {
                                        res.status(400).send('Did you just type a wrong code? '
                                            +(config.limits.smsCodeAttempts - phone.attempts - 1)
                                            +' attempts remaining.')
                                        return                                        
                                    })
                                } else {
                                    db.collection('phone').updateOne({
                                        phone: req.body.phone
                                    }, {
                                        "$inc": {attempts: 1}
                                    }, function() {
                                        res.status(400).send('You failed 3 attempts in a row.')
                                        return                                        
                                    })
                                }
                            } else {
                                res.status(400).send('Error verifying phone number.')
                                return
                            }
                        })
                    } else {
                        // verified !
                        db.collection('account').updateOne({
                            email: token.email
                        }, {
                            $set: {phone: req.body.phone}
                        })
                        res.send()
                    }
                })
            })
        })

        // user submits the new public key he just generated
        app.post('/confirmKeys/:uuid', function(req, res) {
            if (!req.params.uuid || !req.body.pub) {
                res.status(400).send('Missing information')
                return
            }
            verifToken(req, res, function(token) {
                if (!token) return

                db.collection('account').updateOne({
                    email: token.email
                }, {
                    $set: {pub: req.body.pub}
                })
                res.send()
            })
        })

        // user submits a username
        app.post('/chooseUsername/:uuid', function(req, res) {
            if (!req.params.uuid || !req.body.username) {
                res.status(400).send('Missing information')
                return
            }
            req.body.username = req.body.username.trim().toLowerCase()
            if (req.body.username.length < 9) {
                res.status(400).send('Username too short')
                return
            }
            if (req.body.username.replace(/[^0-9]/g,"").length < 2) {
                res.status(400).send('Username needs to contain at least two digits')
                return
            }
            if (!usernameValidation(
                req.body.username,
                50,
                1,
                'abcdefghijklmnopqrstuvwxyz0123456789',
                '-.'
            )) {
                res.status(400).send('Invalid username')
                return
            }
            verifToken(req, res, function(token) {
                if (!token) return

                steem.api.getAccounts([req.body.username], function(err, accounts) {
                    if (err) {
                        res.status(503).send('Steem API error')
                        return
                    }
                    if (accounts.length > 0) {
                        res.status(400).send('Username already taken on STEEM')
                        return
                    }
                    javalon.getAccounts([req.body.username], function(err, accounts) {
                        if (err) {
                            res.status(503).send('Avalon API error')
                            return
                        }
                        if (accounts.length > 0) {
                            res.status(400).send('Username already taken on Avalon')
                            return
                        }
                        db.collection('account').updateOne({
                            email: token.email
                        }, {
                            $set: {username: req.body.username}
                        })
                        res.send()
                    })
                })
            })
        })

        // user submits a username
        app.post('/redo/:uuid', function(req, res) {
            if (!req.params.uuid || !req.body.field) {
                res.status(400).send('Missing information')
                return
            }
            verifToken(req, res, function(token) {
                if (!token) return

                db.collection('account').findOne({email: token.email}, function(err, acc) {
                    if (acc.finalized) {
                        res.status(400).send('You can not go back after your account has been created')
                        return
                    }
                    switch (req.body.field) {
                        case 'username':
                            db.collection('account').updateOne({email: token.email}, {$set: {
                                username: null
                            }})
                            res.send()
                        break;
    
                        case 'facebook':
                            db.collection('account').updateOne({email: token.email}, {$set: {
                                facebook: null
                            }})
                            res.send()
                        break;
    
                        case 'phone':
                            db.collection('account').updateOne({email: token.email}, {$set: {
                                phone: null
                            }})
                            res.send()
                            break;
                    
                        default:
                            res.status(400).send('Missing information')
                            break;
                    }
                })
            })
        })

        // user finalizes his account
        // user submits a username
        app.post('/createAccount/:uuid', function(req, res) {
            if (!req.params.uuid || typeof req.body.optin == 'undefined') {
                res.status(400).send('Missing information')
                return
            }
            verifToken(req, res, function(token) {
                if (!token) return

                db.collection('account').findOne({
                    email: token.email
                }, function(err, acc) {
                    if (!acc || acc.finalized) {
                        res.status(400).send('Can only create account once')
                        return
                    }
                    db.collection('account').updateOne({
                        email: token.email
                    }, {
                        $set: {
                            optin: req.body.optin,
                            finalized: true
                        }
                    }, function() {
                        var give_bw = 50000
                        var give_vt = 500
                        var give_dtc = 10
                        if (acc.phone && acc.phone != 'skip') {
                            give_vt += 2000
                            give_dtc += 60
                        }
                        if (acc.facebook && acc.facebook != 'skip') {
                            give_vt += 1000
                            give_dtc += 30
                        }
                        createAccAndFeed(acc.username, acc.pub, give_bw, give_vt, give_dtc)
                        res.send()
                    })
                })
            })
        })

        // token sale coinbase
        app.post('/buyOther/', function(req, res) {
            if (!req.body.amount || parseInt(req.body.amount)%1 !== 0) {
                res.status(400).send('DTC amount must be an integer')
                return
            }
            if (!emails.validate(req.body.email)) {
                res.status(400).send('Invalid email')
                return
            }
            var price = 0.10*parseInt(req.body.amount)
            price = price.toFixed(2)

            europe = ["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark",
            "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia",
            "French Guiana", "French Polynesia", "French Southern Territories",
            "Guadeloupe", "Martinique", "Mayotte", "Reunion",
            "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia",
            "Slovenia", "Spain", "Sweden", "United Kingdom"]
            if (price > 15000) {
                res.status(400).send('Max amount is $15,000')
                return
            }
            if (europe.indexOf(req.body.country) > -1 && price > 3000) {
                res.status(400).send('Max amount is $3,000 for EU residents')
                return
            }
            var chargeData = {
                'name': 'DTC Round 1',
                'description': req.body.amount+' DTC to @'+req.body.username,
                'pricing_type': 'fixed_price',
                'logo_url': 'https://res.cloudinary.com/commerce/image/upload/v1568140129/sh8bxamfsyrmuwtbut4w.png',
                'local_price': {
                    'amount': price,
                    'currency': 'USD'
                }
            }
            Charge.create(chargeData, function (error, charge) {
                if (error) {
                    res.status(503).send('Coinbase error')
                    return
                }
                res.send(charge.code)
                console.log('New Coinbase Charge '+req.body.amount+' DTC '+charge.code)
                charge.personal_info = req.body
                db.collection('charges').insertOne(charge)
                
            });
        })

        // token sale steem
        app.post('/buySteem/', function(req, res) {
            if (!req.body.amount || parseInt(req.body.amount)%1 !== 0) {
                res.status(400).send('DTC amount must be an integer')
                return
            }
            if (!emails.validate(req.body.email)) {
                res.status(400).send('Invalid email')
                return
            }

            var price_usd = 0.10*parseInt(req.body.amount)
            price_usd = price_usd.toFixed(2)
            europe = ["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark",
            "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia",
            "French Guiana", "French Polynesia", "French Southern Territories",
            "Guadeloupe", "Martinique", "Mayotte", "Reunion",
            "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia",
            "Slovenia", "Spain", "Sweden", "United Kingdom"]
            if (price_usd > 15000) {
                res.status(503).send('Max amount is $15,000')
                return
            }
            if (europe.indexOf(req.body.country) > -1 && price_usd > 3000) {
                res.status(503).send('Max amount is $3,000 for EU residents')
                return
            }

            var price = STEEM_DTC*parseInt(req.body.amount)
            price = price.toFixed(3)
            console.log('New Steem Charge '+req.body.amount+' DTC ')
            var charge = {
                id: uuidv4(),
                price: price,
                ts: new Date().getTime()
            }
            res.send(charge)
            charge.personal_info = req.body
            db.collection('charges').insertOne(charge)
        })

        app.get('/isPaidSteem/:orderid', function(req, res) {
            if (!req.params.orderid) {
                res.status(400).send('Missing order id')
                return
            }
            db.collection('charges').findOne({
                id: req.params.orderid,
                status: 'charge:confirmed'
            }, function(err, charge) {
                if (!charge) {
                    res.send({paid: false})
                } else {
                    res.send({paid: true})
                }
            })
        })

        // coinbase verify payments
        app.post('/webhook/', function(req, res) {
            var signature = req.headers['x-cc-webhook-signature']
            //console.log(signature, req.body)
            try {
                event = Webhook.verifyEventBody(
                        JSON.stringify(req.body),
                        signature,
                        config.coinbase.secret
                );
            } catch (error) {
                console.log('Error occured', error.message);
                res.status(400).send('Webhook Error:' + error.message);
                return;
            }
            res.send('Signed Webhook Received: ' + event.id);
            var status = event.type
            console.log('Coinbase '+status+' '+event.data.code)
            db.collection('charges').updateOne({id: event.data.id}, {"$set": {
                "status": status,
                "timeline": event.data.timeline
            }})
            db.collection('charges').findOne({id: event.data.id}, function(err, charge) {
                if (status === 'charge:confirmed')
                    emails.sendOrderComplete(charge, function(err) {
                        if (err) console.log(err)
                    })
            })
        })
    })
})

function verifToken(req, res, cb) {
    var ip_addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    db.collection('tokens').findOne({_id: req.params.uuid}, function(err, token) {
        if (err || !token) {
            res.status(400).send('Error verifying uuid')
            cb(null)
            return
        }
        cb(token)

        if (!token.ip || token.ip.indexOf(ip_addr) === -1) {
            db.collection('tokens').updateOne({_id: token._id}, {
                "$push": {ip: ip_addr}
            })
        }
    })
}

function updateTokenPrice() {
    var url = "https://api.cryptonator.com/api/ticker/steem-usd"
    axios.get(url)
    .then(function (response) {
        if (!response || !response.data || !response.data.ticker || !response.data.ticker.price) {
            return
        }
        STEEM_USD = response.data.ticker.price
        STEEM_DTC = 0.1/(STEEM_USD)
        //console.log('STEEM_DTC = '+STEEM_DTC)
    })
    .catch(function (error) {
      console.log(error);
    })
}
if (config.updateTokenPrice > 0) {
    setInterval(function() {
        updateTokenPrice()
    }, config.updateTokenPrice)
    updateTokenPrice()
}

function createAccAndFeed(username, pubKey, give_bw, give_vt, give_dtc) {
    console.log('Creating '+username+' '+pubKey)
    var txData = {
        pub: pubKey,
        name: username
    }
    var newTx = {
        type: 0,
        data: txData
    }
    newTx = javalon.sign(config.avalon.priv, config.avalon.account, newTx)
    javalon.sendTransaction(newTx, function(err, res) {
        if (err) return
        console.log('Feeding '+username)
        setTimeout(function() {
            if (give_vt) {
                var newTx = {
                    type: 14,
                    data: {
                        amount: give_vt,
                        receiver: username
                    }
                }
                newTx = javalon.sign(config.avalon.priv, config.avalon.account, newTx)
                javalon.sendTransaction(newTx, function(err, res) {})
            }

            if (give_bw) {
                var newTx = {
                    type: 15,
                    data: {
                        amount: give_bw,
                        receiver: username
                    }
                }
                newTx = javalon.sign(config.avalon.priv, config.avalon.account, newTx)
                javalon.sendTransaction(newTx, function(err, res) {})
            }
            
            if (give_dtc) {
                var newTx = {
                    type: 3,
                    data: {
                        amount: give_dtc,
                        receiver: username,
                        memo: 'Thank you for signing up!'
                    }
                }
                newTx = javalon.sign(config.avalon.priv, config.avalon.account_dtc, newTx)
                javalon.sendTransaction(newTx, function(err, res) {})
            }
        }, 6000)
    })
}