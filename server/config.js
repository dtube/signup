var config = {
    protocol: process.env.PROTOCOL || 'http://',
    ssl: process.env.ENABLE_SSL || false,
    domain: process.env.DOMAIN || "http://localhost:3000",
    hcaptchaSecret: process.env.HCAPTCHA_SECRET || "aaa",
    aws: {
        id: process.env.AWS_ID || "123",
        secret: process.env.AWS_SECRET || "bbb"
    },
    fb: {
        id: process.env.FB_ID || "456",
        secret: process.env.FB_SECRET || "ccc"
    },
    coinbase: {
        apiKey: process.env.COINBASE_API || 'ddd'
    }
}

module.exports = config