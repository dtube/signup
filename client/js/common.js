function toastError(message) {
    $("#toastError")[0].innerHTML = message
    $("#toastError").show()
}

function toastSuccess(message) {
    $("#toastSuccess")[0].innerHTML = message
    $("#toastSuccess").show()
}

function hideToasts() {
    $("#toastError").hide()
    $("#toastSuccess").hide()
}

function validateEmail(address) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(address)
}

function progress(n) {
    if (n == -1) {
        $('#progress').hide()
        return
    }
    $('#progress>ul>li').removeClass('active')
    $('#progress>ul>li')[n].classList.add('active')
}