var AWS = require('aws-sdk')
var config = require('./config.js').aws

AWS.config.update({
    "region": "us-east-1",
    "accessKeyId": config.id,
    "secretAccessKey": config.secret
});

module.exports = AWS