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
        hideToasts()
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
checkbox1.oninput = function() {canSendKeys()}
checkbox2.oninput = function() {canSendKeys()}
function canSendKeys() {
    if (checkbox1.checked && checkbox2.checked)
        $("#confirmKeys").prop('disabled', false)
    else
        $("#confirmKeys").prop('disabled', true)
}
saveKeys.onclick = function() {
    var pub = $("#public").val();
    var priv = $("#private").val();
    var key = JSON.stringify({
        pub: pub,
        priv: priv
    })
    var blob = new Blob([key], {type: "text/plain;charset=utf-8"})
    alert("Do not share your private key with anyone, even DTube staff")
    alert("Do not lose your private key or it cannot be recovered")
    saveAs(blob, "dtube_key.txt")
}

copyPriv.onclick = function() {
    var text = $('#private').val();
    if (window.clipboardData && window.clipboardData.setData) {
      clipboardData.setData("Text", text);
    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
      var textarea = document.createElement("textarea");
      textarea.textContent = text;
      textarea.style.position = "fixed";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (ex) {
      } finally {
        document.body.removeChild(textarea);
      }
    }
    toastSuccess('Private Key copied to clipboard!')
}

confirmKeys.onclick = function() {
    if (!$("#checkbox1")[0].checked || !$("#checkbox2")[0].checked) {

    }
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

changeUsername.onclick = function() {
    axios({
        method: "POST",
        timeout: 15000,
        url: "/redo/"+myUuid,
        data: {
            field: 'username'
        }
    }).then(function(data) {
        console.log(data)
        loadInfo(myUuid)
    }).catch(function(err, data) {
        console.log(err)
        loadInfo(myUuid)
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
    hideToasts()
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
        $('#account_creation').hide()
        $('#congratulations').hide()
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
        var ifrm = document.createElement('iframe');
        ifrm.setAttribute('id', 'ifrm'); // assign an id
        var el = document.getElementById('presVideo');
        el.appendChild(ifrm);
        
        // assign url
        ifrm.setAttribute('src', 'https://emb.d.tube/#!/hetmasteen/QmRZMemN8bZ9Pqmk5peZrqjjtgGbCiDSJU7oBZLmuL5ZgP/true');
        ifrm.setAttribute('width', '100%')
        ifrm.setAttribute('height', '100%')
        ifrm.style.border = 0
        
        $("#userDisp2")[0].innerHTML = '@'+account.username
        $('#channelUrl')[0].innerHTML = 'https://d.tube/c/'+account.username
        $('#goToChannel')[0].href = 'https://d.tube/#!/c/'+account.username
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
    var vp = 1000
    var dtc = 0.1
    if (account.facebook === 'skip')
        unverified('facebook')
    else {
        vp += 1000
        dtc += 1
    }

    if (account.phone === 'skip')
        unverified('phone')
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

function unverified(name) {
    var line = $("#row"+name)
    line[0].style.textDecoration = 'underline'
    line[0].style.cursor = 'pointer'
    line.children()[0].innerHTML = "<strong>X</strong>"
    line.removeClass('green')
    line[0].onclick = function() {
        axios({
            method: "POST",
            timeout: 15000,
            url: "/redo/"+myUuid,
            data: {
                field: name
            }
        }).then(function(data) {
            console.log(data)
            loadInfo(myUuid)
        }).catch(function(err, data) {
            console.log(err)
            loadInfo(myUuid)
        })
    }
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