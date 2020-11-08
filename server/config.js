var config = {
    avalon: {
        api: process.env.AVALON_API || 'http://localhost:3001',
        priv: process.env.AVALON_PRIV || 'fff',
        account: process.env.AVALON_USER || 'dtube',
        account_dtc: process.env.AVALON_USER_DTC || 'dtube.signup',
        account_airdrop: process.env.AVALON_USER_AIRDROP || 'dtube.airdrop',
        account_airdrop_priv: process.env.AVALON_PRIV_AIRDROP || 'fff'
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
    mailgun: {
        apiKey: process.env.MAILGUN_API || 'fff',
        domain: process.env.MAILGUN_DOMAIN || 'mg.d.tube'
    },
    limits: {
        maxTokensSold: 1000000,
        smsCount: 3,
        smsPeriod: 1000*60*60*24,
        emailCount: 5,
        emailPeriod: 1000*60*60*24,
        smsCodeAttempts: 3
    },
    smsAllowedCountries: [
        1, // USA + Canada
        91, // India
        350, // Gibraltar
        386, // Slovenia
        356, // Malta
        972, // Israel
        234, // Nigeria
        27, // South Africa
        352, // Luxembourg
        966, // Saudi Arabia
        66, // Thailand
        90, // Turkey
        86, // China
        971, // UAE
        41, // Switzerland
        45, // Denmark
        44, // United Kingdom
        82, // South Korea
        357, // Cyprus
        65, // Singapore
    ],
    steemStreamer: true,
    steemStartBlock: 36563600,
    updateTokenPrice: 10*60000,
    partnersAdmins: [
        "curator",
        "steeminator3000",
        "heimindanger",
        "french.fyde"
    ]
}

module.exports = config
