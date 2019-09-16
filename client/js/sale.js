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
        var bar = data.data
        var filled = bar.confirmed+bar.pending
        var percent = 0.1*Math.floor((1000*filled)/(bar.max))
        percent = percent.toFixed(1)
        console.log('Round 1 is '+percent+'% filled')
        $('#progressRound1').width(''+percent+'%')
        $('#filledRound1')[0].innerHTML = formatNumber(filled)
        $('#percentRound1')[0].innerHTML = percent
        cb()
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
    if (!err) {
        $("#loader").hide()
        $("#infoRound1").show()
    }
})
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
        // if (javalon.privToPub(inputKey) !== account.pub) {
        //     toastError("Private key does not match for account @"+inputUsername)
        //     return
        // }
        $("#step0").hide()
        $("#step1").show()
        $('#toastError').hide()
        progress(1)
    })
}

btnStep1.onclick = function() {
    $("#step1").hide()
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
            // pub: javalon.privToPub($('#priv').val()),
            pub: 'uNc0MM3nTm3',
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
        $('#memoSteem')[0].innerHTML = charge.uuid

        if (typeof steem_keychain != 'undefined') {
            $('#buyKeychain').prop('disabled', false)
        }

        $('.modal').addClass('active')
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
            // pub: javalon.privToPub($('#priv').val()),
            pub: 'uNc0MM3nTm3',
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
    window.location.href = "https://steemconnect.com/sign/transfer?to=dtube&amount="
    +$('#amountSteem')[0].innerHTML
    +"&memo="
    +$('#memoSteem')[0].innerHTML
}

buyKeychain.onclick = function() {
    var amount = $('#amountSteem')[0].innerHTML
    var currency = 'STEEM'
    steem_keychain.requestTransfer($('#username').val(), 'dtube', amount, $('#memoSteem')[0].innerHTML, currency, function(response) {
        console.log(response);
    }, false);
}

