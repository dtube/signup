afterEmail.onclick = function() {
    var address = email.value
    if (validateEmail(address)) {
        $('#step1').hide()
        $('#step2').show()
        randomPlacementCaptcha()
    }
}

goBack.onclick = function() {
    $('#step3').hide()
    $('#step1').show()
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