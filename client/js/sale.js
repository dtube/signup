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
        
    }).catch(function(err, data) {
        console.log(err.response.data)
        toastError(err.response.data)
    })
}

