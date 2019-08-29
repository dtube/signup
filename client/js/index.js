// email
myEmail = null

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
    $('#step1').show()
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
        console.log(err)
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
        console.error("Timeout ", error.code)
        return
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
        console.error("Timeout ", error.code)
        return
    })
}

sendCode.onclick = function() {
    axios({
        method: "POST",
        timeout: 15000,
        url: "/smsCode/"+myUuid,
        data: {
            phone: $('#phone').val() 
        }
    }).then(function(data) {
        console.log(data)
        $('#sms_verif').hide()
        $('#sms_verif2').show()
    }).catch(function(err, data) {
        console.log(err)
    })
}

verifySmsCode.onclick = function() {
    axios({
        method: "POST",
        timeout: 15000,
        url: "/smsVerify/"+myUuid,
        data: {
            phone: $('#phone').val(),
            code: $('#code').val()
        }
    }).then(function(data) {
        console.log(data)
        $('#sms_verif2').hide()
        $('#key_generator').show()
        progress(4)
        var key = javalon.keypair()
        $('#public').val(key.pub)
        $('#private').val(key.priv)
    }).catch(function(err, data) {
        console.log(err)
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
        progress(5)
    }).catch(function(err, data) {
        console.log(err)
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
        console.log(err)
    })
}

function progress(n) {
    $('#progress>ul>li').removeClass('active')
    $('#progress>ul>li')[n].classList.add('active')
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
        if (!account.personal_info) {
            $('#personal_info').show()
            $('#email').val(myEmail)
            progress(1)
            return
        }
        if (!account.facebook) {
            $('#facebook_verif').show()
            progress(2)
            return
        }
        if (!account.phone) {
            $('#sms_verif').show()
            progress(3)
            return
        }
        if (!account.pub) {
            $('#key_generator').show()
            progress(4)
            var key = javalon.keypair()
            $('#public').val(key.pub)
            $('#private').val(key.priv)
            return
        }
        if (!account.username) {
            $('#username_choice').show()
            progress(5)
            return
        }
        lastStep(account)
        return
    })
    .catch((error) => {
        console.error("Timeout ", error.code)
        return
    })
}

function lastStep(account) {
    $('#account_creation').show()
    $('#progress>ul>li')[6].classList.add('active')
    var vp = 1000
    var dtc = 0.2
    if (account.facebook === 'skip')
        $('#rowFacebook')[0].style.textDecoration = 'line-through'
    else {
        vp += 500
        dtc += 1
    }
    if (account.phone === 'skip')
        $('#rowPhone')[0].style.textDecoration = 'line-through'
    else {
        vp += 1000
        dtc += 5
    }
    $("#userDisp")[0].innerHTML = '@'+account.username
    $("#totalVP")[0].innerHTML = vp
    $("#totalDTC")[0].innerHTML = dtc
}

function validateEmail(address) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(address)
}

function randomPlacementCaptcha(){
    var randLeft = Math.round((0.5-Math.random())*window.innerWidth/2)
    var randTop = Math.round((Math.random()*window.innerHeight/4))
    document.getElementById('captchaContainer').style.marginLeft = randLeft + 'px'
    document.getElementById('captchaContainer').style.marginTop = randTop + 'px'
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