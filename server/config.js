var config = {
    avalon: {
        api: process.env.AVALON_API || 'http://localhost:3001',
        priv: process.env.AVALON_PRIV || 'fff',
        account: process.env.AVALON_USER || 'dtube'
    },
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
        apiKey: process.env.COINBASE_API || 'ddd',
        secret: process.env.COINBASE_SECRET || 'eee'
    },
    limits: {
        maxTokensSold: 0,
        smsCount: 2,
        smsPeriod: 1000*60*60,
        emailCount: 5,
        emailPeriod: 1000*60*5,
        smsCodeAttempts: 3
    },
    steemStreamer: false,
    updateTokenPrice: 10*60000
}

module.exports = config