// email
myEmail = null

startSignup.onclick = function() {
    $('#front').hide()
    $('#step1').show()
}

afterEmail.onclick = function() {
    var address = email_front.value
    if (validateEmail(address)) {
        $('#step1').hide()
        $('#step2').show()
        randomPlacementCaptcha()
    }
}

goBack.onclick = function() {
    $('#step3').hide()
    $('#front').show()
}

// personal info
submitPersonalInfo.onclick = function() {
    loader()
    axios({
        method: "POST",
        timeout: 15000,
        url: "/personalInfo/"+myUuid,
        data: {
            personal_info: {
                birth: $('#birth').val(),
                country: $('#country').val(),
                postal: $('#postal').val(),
                fullname: $('#fullname').val(),
                fulladdress: $('#fulladdress').val(),
            }
        }
    }).then(function(data) {
        loadInfo(myUuid)
    }).catch(function(err, data) {
        console.log(err.response.data)
        loadInfo(myUuid)
        toastError(err.response.data)
    })
}

skipFb.onclick = function() {
    var url = '/skipFb/'+myUuid
    var options = {
        method: 'GET',
        timeout: 15000,
        url: url,
    }
    axios(options)
    .then((data) => {
        loadInfo(myUuid)
    })
    .catch((error) => {
        console.log(err.response.data)
        loadInfo(myUuid)
        toastError(err.response.data)
    })
}
fbConnect.onclick = function() {
    location.href = '/auth/facebook'
}


// sms
skipSms.onclick = function() {
    var url = '/skipSms/'+myUuid
    var options = {
        method: 'GET',
        timeout: 15000,
        url: url,
    }
    axios(options)
    .then((data) => {
        loadInfo(myUuid)
    })
    .catch((error) => {
        console.log(err.response.data)
        loadInfo(myUuid)
        toastError(err.response.data)
    })
}

backSms.onclick = function() {
    $('#sms_verif').show()
    $('#sms_verif2').hide()
}

sendCode.onclick = function() {
    var phone = $('#phone').val()
    var extension = $(".iti__selected-flag")[0].title.split('+')[1]
    var number = '+'+extension+phone
    console.log(number)
    axios({
        method: "POST",
        timeout: 15000,
        url: "/smsCode/"+myUuid,
        data: {
            phone: number
        }
    }).then(function(data) {
        console.log(data)
        $('#sms_verif').hide()
        $('#sms_verif2').show()
    }).catch(function(err, data) {
        console.log(err.response.data)
        loadInfo(myUuid)
        toastError(err.response.data)
    })
}

verifySmsCode.onclick = function() {
    var phone = $('#phone').val()
    var extension = $(".iti__selected-flag")[0].title.split('+')[1]
    var number = '+'+extension+phone
    axios({
        method: "POST",
        timeout: 15000,
        url: "/smsVerify/"+myUuid,
        data: {
            phone: number,
            code: $('#code').val()
        }
    }).then(function(data) {
        console.log(data)
        $('#sms_verif2').hide()
        $('#key_generator').show()
        progress(3)
        var key = javalon.keypair()
        $('#public').val(key.pub)
        $('#private').val(key.priv)
    }).catch(function(err, data) {
        console.log(err.response.data)
        toastError(err.response.data)
    })
}

// keys

confirmKeys.onclick = function() {
    axios({
        method: "POST",
        timeout: 15000,
        url: "/confirmKeys/"+myUuid,
        data: {
            pub: $("#public").val()
        }
    }).then(function(data) {
        console.log(data)
        $('#key_generator').hide()
        $('#username_choice').show()
        progress(4)
    }).catch(function(err, data) {
        console.log(err.response.data)
        loadInfo(myUuid)
        toastError(err.response.data)
    })
}

// username

chooseUsername.onclick = function() {
    axios({
        method: "POST",
        timeout: 15000,
        url: "/chooseUsername/"+myUuid,
        data: {
            username: $("#username").val()
        }
    }).then(function(data) {
        console.log(data)
        location.href = location.origin
    }).catch(function(err, data) {
        console.log(err.response.data)
        loadInfo(myUuid)
        toastError(err.response.data)
    })
}

createAccount.onclick = function() {
    axios({
        method: "POST",
        timeout: 15000,
        url: "/createAccount/"+myUuid,
        data: {
            optin: $("#checkbox3")[0].checked
        }
    }).then(function(data) {
        console.log(data)
        loadInfo(myUuid)
    }).catch(function(err, data) {
        console.log(err.response.data)
        loadInfo(myUuid)
        toastError(err.response.data)
    })
}

function loader() {
    $('#loader').show()
    $('#personal_info').hide()
    $('#facebook_verif').hide()
    $('#sms_verif').hide()
    $('#option_payment').hide()
}

function loadInfo(uuid) {
    $('#loader').show()
    $("#toastError").hide()
    var url = '/signup/'+uuid
    var options = {
        method: 'GET',
        timeout: 15000,
        url: url,
    }
    axios(options)
    .then((data) => {
        $('#loader').hide()
        $('#personal_info').hide()
        $('#facebook_verif').hide()
        $('#sms_verif').hide()
        $('#option_payment').hide()
        $("#progress").show()
        var account = data.data
        console.log(account)
        myEmail = account.email
        // if (!account.personal_info) {
        //     $('#personal_info').show()
        //     $('#email').val(myEmail)
        //     progress(1)
        //     return
        // }
        if (!account.facebook) {
            $('#facebook_verif').show()
            progress(1)
            return
        }
        if (!account.phone) {
            $('#sms_verif').show()
            progress(2)
            $("#phone").intlTelInput({
                preferredCountries: ["us", "de", "gb", "in", "fr", "kr", "ru", "cn"]
            });
            return
        }
        if (!account.pub) {
            $('#key_generator').show()
            progress(3)
            var key = javalon.keypair()
            $('#public').val(key.pub)
            $('#private').val(key.priv)
            return
        }
        if (!account.username) {
            $('#username_choice').show()
            progress(4)
            return
        }
        if (!account.finalized) {
            accountCreation(account)
            return
        }
        $('#account_creation').hide()
        $('#congratulations').show()
        $('#presVideo').height( 9*$('#presVideo').width()/16 )
        $("#userDisp2")[0].innerHTML = '@'+account.username
        progress(-1)
        return
    })
    .catch((error) => {
        console.error("Could not load info", error.code)
        localStorage.setItem('uuid', '')
        location.href = location.origin
        return
    })
}

function accountCreation(account) {
    $('#account_creation').show()
    progress(5)
    var vp = 500
    var dtc = 0.1
    if (account.facebook === 'skip')
        unverified($('#rowFacebook'))
    else {
        vp += 500
        dtc += 1
    }

    if (account.phone === 'skip')
        unverified($('#rowPhone'))
    else {
        vp += 1000
        dtc += 5
    }
    $("#userDisp")[0].innerHTML = '@'+account.username
    $("#totalVP")[0].innerHTML = '+'+vp
    $("#totalDTC")[0].innerHTML = '+'+dtc
}

function randomPlacementCaptcha(){
    var randLeft = Math.round((0.5-Math.random())*window.innerWidth/2)
    var randTop = Math.round((Math.random()*window.innerHeight/4))
    document.getElementById('captchaContainer').style.marginLeft = randLeft + 'px'
    document.getElementById('captchaContainer').style.marginTop = randTop + 'px'
}

function unverified(line) {
    line[0].style.textDecoration = 'underline'
    line[0].style.cursor = 'pointer'
    line.children()[0].innerHTML = "<strong>X</strong>"
    line.removeClass('green')
    // line.addClass('red-dtube')
}

function linkFacebook(token) {
    var url = '/linkFacebook/'+token+'/'+myUuid
    var options = {
        method: 'GET',
        timeout: 15000,
        url: url,
    }
    axios(options)
    .then((data) => {
        location.href = location.origin
    })
    .catch((error) => {
        console.error("Timeout ", error.code)
        return
    })
}