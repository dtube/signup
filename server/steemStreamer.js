const steem = require('steem')
const config = require('./config.js')
const start_block = config.steemStartBlock

var streamer = {
    db: null,
    lirb: 0,
    start: function(db) {
        streamer.db = db

        setInterval(() => {
            steem.api.getDynamicGlobalProperties(function(err, props) {
                streamer.lirb = parseInt(props.last_irreversible_block_num);
                //console.log('LIRB: '+streamer.lirb)
            })
        }, 3000)

        steem.api.getDynamicGlobalProperties(function(err, props) {
            streamer.lirb = parseInt(props.last_irreversible_block_num);         
            streamer.db.collection('last_steem_block').findOne({}, function(err, block) {
                if (err) throw err;
                if (!block) {
                    block = {
                        height: start_block
                    }
                    streamer.db.collection('last_steem_block').insertOne(block)
                }
                //console.log(`Last loaded block was ${block.height}`);
                const nextBlockNum = block.height + 1
                streamer.handleBlock(nextBlockNum)
            })
        })
    },
    handleBlock: function(blockNum) {
        if (streamer.lirb >= blockNum) {
            steem.api.getBlock(blockNum, function(err, block) {
                if (err) {
                    if (blockNum%100 == 0)
                        console.error(`Request 'getBlock' failed at block num: ${blockNum}, retry`, err);
                    streamer.handleBlock(blockNum);
                    return
                }
                streamer.work(block, function() {
                    streamer.db.collection('last_steem_block').replaceOne({height: blockNum-1}, {$set: {
                        height: blockNum,
                        timestamp: block.timestamp
                    }}, function(err) {
                        if (err) {
                            console.error("Failed to set 'block_height' on MongoDB", err);
                            streamer.handleBlock(blockNum);
                            return
                        }
                        console.log(`New block height is ${blockNum} ${block.timestamp}`);
                        streamer.handleBlock(blockNum + 1)
                    })
                })
            })
        } else {
            setTimeout(function() {
                streamer.handleBlock(blockNum)
            }, 100)
        }
    },
    work: function(block, cb) {
        let txs = block.transactions
        for (let i = 0; i < txs.length; i++) {
            let tx = txs[i];
            for (let y = 0; y < tx.operations.length; y++) {
                let op = tx.operations[y];
                if (op[0] === 'transfer'
                    && op[1].to === 'dtube'
                    && op[1].memo
                ) {
                    console.log('Received '+op[1].amount+' from '+op[1].from+' '+op[1].memo)
                    streamer.db.collection('charges').findOne({
                        id: op[1].memo
                    }, function(err, charge) {
                        if (!charge) {
                            console.log("Error finding matching payment!!")
                            return
                        }
                        var paid = op[1].amount.split(' ')
                        paid[0] = parseFloat(paid[0])
                        if (paid[1] !== 'STEEM') {
                            console.log("Error received wrong currency "+paid[1])
                            return
                        }
                        if (paid[0] < parseFloat(charge.price)) {
                            console.log("Error payment too little")
                            return
                        }
                        console.log("Confirmed STEEM charge "+op[1].memo)
                        streamer.db.collection('charges').updateOne({
                            id: op[1].memo
                        }, {$set: {
                            status: 'charge:confirmed',
                            steemTx: tx
                        }})
                    })
                }
            }
        }
        cb()
    }
}

module.exports = streamer

