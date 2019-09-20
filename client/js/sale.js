function validStep1() {
    var res = true
    if (!$('#country').val())
        res = false

    if (!$('#email_front').val() && validateEmail($('#email_front').val()))
        res = false

    if (!$('#fullname_front').val())
        res = false

    if (!$('#fulladdress').val())
        res = false

    if (!agreePrivacy.checked)
        res = false

    $("#btnStep1").prop('disabled', !res)    
    return res
}
function validStep3() {
    var res = true
    if (!agreeSale.checked)
        res = false

    $("#buySteem").prop('disabled', !res)
    $("#buyOther").prop('disabled', !res)    
    return res
}
function loadBar(cb) {
    var url = '/bar'
    var options = {
        method: 'GET',
        timeout: 15000,
        url: url,
    }
    axios(options)
    .then((data) => {
        bar = data.data
        var filled = bar.confirmed+bar.pending
        var percent = 0.1*Math.floor((1000*filled)/(bar.max))
        percent = percent.toFixed(1)
        //console.log('Round 1 is '+percent+'% filled')
        if (bar.max>0 && percent<100) {
            $('#progressRound1').width(''+percent+'%')
            $('#filledRound1')[0].innerHTML = formatNumber(filled)
            $('#maxRound1')[0].innerHTML = formatNumber(bar.max)
            $('#percentRound1')[0].innerHTML = percent
            cb()
        }
        else if (bar.max==0) {
            cb('Token sale is not opened yet')
            $("#notopen").show()
        }
        else if (percent>=100) {
            cb('Round 1 is sold out.')
            $("#soldout").show()
        }
            
    })
    .catch((error) => {
        console.log(err.response.data)
        toastError(err.response.data)
        cb(err.response.data)
    })
}
function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

loadBar(function(err){
    $("#loader").hide()
    if (!err) {
        $("#infoRound1").show()
        $('#step0').show()
        $('#round1bar').show()
    } else {
        $("#infoRound1").hide()
        $("#progress").hide()
        $("#round1bar").hide()
        $("#soldout").hide()
        $("#notopen").hide()
    }
})
setInterval(function() {
    loadBar(function(err) {
        if (!err) {
            $("#infoRound1").show()
            $('#round1bar').show()
        } else {
            $("#infoRound1").hide()
            $("#progress").hide()
            $("#round1bar").hide()
            $("#soldout").hide()
            $("#notopen").hide()
        }
    })
}, 10000)
country.oninput = function() {validStep1()}
email_front.oninput = function() {validStep1()}
fullname_front.oninput = function() {validStep1()}
fulladdress.oninput = function() {validStep1()}
agreePrivacy.oninput = function() {validStep1()}
agreeSale.oninput = function() {validStep3()}

btnStep0.onclick = function() {
    var inputUsername = $('#username').val().trim().replace('@','')
    var inputKey = $('#priv').val().trim()
    javalon.getAccounts([inputUsername], function(error, accounts) {
        if (error) {
            toastError(error.message)
            throw error;
        } 
        if (!accounts || accounts.length === 0) {
            toastError("Could not find account @"+inputUsername)
            return
        }
        var account = accounts[0]
        if (javalon.privToPub(inputKey) !== account.pub) {
            toastError("Private key does not match for account @"+inputUsername)
            return
        }
        $("#step0").hide()
        $("#step1").show()
        $('#toastError').hide()
        progress(1)
    })
}

btnStep1.onclick = function() {
    hideToasts()
    if (!validateEmail($("#email_front").val())) {
        toastError("Please enter a valid email")
        return
    }
    $("#step1").hide()

    var real_max = 150000
    europe = ["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark",
    "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia",
    "French Guiana", "French Polynesia", "French Southern Territories",
    "Guadeloupe", "Martinique", "Mayotte", "Reunion",
    "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia",
    "Slovenia", "Spain", "Sweden", "United Kingdom"]

    if (europe.indexOf($("#country").val()) > -1) {
        real_max = 30000
        $('.isEurope').show()
    }

    if ((bar.max-bar.pending-bar.confirmed) < real_max)
        real_max = (bar.max-bar.pending-bar.confirmed)

    $("#dtcnumber")[0].max = real_max
    $("#dtcslider")[0].max = real_max

    if ($("#dtcnumber")[0].value > real_max)
        $("#dtcnumber")[0].value = real_max

    if ($("#dtcslider")[0].value > real_max)
        $("#dtcslider")[0].value = real_max

    $("#step2").show()
    progress(2)
    $("#usernameDisp")[0].innerHTML = $("#username").val()
    $("#dtcDisp")[0].innerHTML = $("#dtcnumber").val()
}

dtcslider.oninput = function() {
    $("#dtcnumber").val($("#dtcslider").val())
    calcPrice($("#dtcslider").val())
}
dtcnumber.oninput = function() {
    $("#dtcslider").val($("#dtcnumber").val())
    calcPrice($("#dtcnumber").val())
}

function calcPrice(dtc) {
    $("#dtcDisp")[0].innerHTML = dtc
    dtc = parseInt(dtc)
    var price = 0
    price += dtc*0.10
    price = price.toFixed(2)
    $("#priceDisp")[0].innerHTML = '$'+price
}

buySteem.onclick = function() {
    axios({
        method: "POST",
        timeout: 15000,
        url: "/buySteem/",
        data: {
            username: $('#username').val(),
            pub: javalon.privToPub($('#priv').val()),
            // pub: 'uNc0MM3nTm3',
            country: $('#country').val(),
            email: $('#email_front').val(),
            fullname: $('#fullname_front').val(),
            fulladdress: $('#fulladdress').val(),
            amount: $('#dtcnumber').val()
        }
    }).then(function(data) {
        var charge = data.data
        console.log(charge)
        $('#amountSteem')[0].innerHTML = charge.price
        $('#memoSteem')[0].innerHTML = charge.id

        steemPayFinish = new Date().getTime() + 15*60*1000
        var countdownSteem = setInterval(function() {
            var timeLeft = steemPayFinish - new Date().getTime()
            if (timeLeft < 1) {
                $("#timePaySteem")[0].innerHTML = "Payment failed to verify in time."
                return
            }
            var secs = Math.floor(timeLeft/1000)
            var mins = Math.floor(secs/60)
            secs = secs - 60*mins

            if (secs.length == 1) secs = '0'+secs
            if (mins.length == 1) mins = '0'+mins
            
            $("#timePaySteem")[0].innerHTML = mins+':'+secs
        }, 1000)
        var paymentCheckSteem = setInterval(function() {
            var url = '/isPaidSteem/'+charge.id
            var options = {
                method: 'GET',
                timeout: 15000,
                url: url,
            }
            axios(options)
            .then((data) => {
                console.log(data.data)
                if (data.data && data.data.paid) {
                    $("#steemModalContainer")[0].innerHTML = '<div class="modal-body" style="color:black; text-align: center"><h1><i class="icon icon-check"></i> Payment Validated!</h1><p>Please check your emails</p></div>'
                    clearTimeout(countdownSteem)
                    clearTimeout(paymentCheckSteem)
                }
            })
            .catch((err) => {
                console.log(err.response.data)
                toastError(err.response.data)
                cb(err.response.data)
            })
        }, 6000)
        $('#memoSteem')[0].innerHTML = charge.id

        if (typeof steem_keychain != 'undefined') {
            $('#buyKeychain').prop('disabled', false)
        }

        $('.modalPaySteem').addClass('active')
    }).catch(function(err, data) {
        console.log(err.response.data)
        toastError(err.response.data)
    })
}

buyOther.onclick = function() {
    axios({
        method: "POST",
        timeout: 15000,
        url: "/buyOther/",
        data: {
            username: $('#username').val(),
            pub: javalon.privToPub($('#priv').val()),
            // pub: 'uNc0MM3nTm3',
            country: $('#country').val(),
            email: $('#email_front').val(),
            fullname: $('#fullname_front').val(),
            fulladdress: $('#fulladdress').val(),
            amount: $('#dtcnumber').val()
        }
    }).then(function(data) {
        var code = data.data
        window.location.href = "https://commerce.coinbase.com/charges/"+code
    }).catch(function(err, data) {
        console.log(err.response.data)
        toastError(err.response.data)
    })
}

closeModal.onclick = function() {
    $('.modal').removeClass('active')
}

buySteemconnect.onclick = function() {
    var url = "https://steemconnect.com/sign/transfer?to=dtube&amount="
    +$('#amountSteem')[0].innerHTML
    +" STEEM&memo="
    +$('#memoSteem')[0].innerHTML
    window.open(url);
}

buyKeychain.onclick = function() {
    var amount = $('#amountSteem')[0].innerHTML
    var currency = 'STEEM'
    steem_keychain.requestTransfer($('#username').val(), 'dtube', amount, $('#memoSteem')[0].innerHTML, currency, function(response) {
        console.log(response);
    }, false);
}

alertNextRound.onclick = function() {
    axios({
        method: "POST",
        timeout: 15000,
        url: "/alertNextRound/",
        data: {
            email: $("#alertEmail").val()
        }
    }).then(function(data) {
        if (data.data.ok) {
            toastSuccess('Email added! Thank you for your interest.')
        } else {
            toastError('Error... Wrong email?')
        }
    }).catch(function(err, data) {
        console.log(err.response.data)
        toastError(err.response.data)
    })
}