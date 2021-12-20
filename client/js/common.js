function toastError(message) {
    $("#toastError")[0].text(message)
    $("#toastError").show()
    $("#toastSuccess").hide()
}

function toastSuccess(message) {
    $("#toastSuccess")[0].text(message)
    $("#toastSuccess").show()
    $("#toastError").hide()
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

function openModal(type) {
    $("#modalContent")[0].innerHTML = ''
    $('.modal').addClass('active')
    var ifrm = document.createElement('iframe');
    ifrm.setAttribute('id', 'legalDoc'); // assign an id
    var el = document.getElementById('modalContent');
    el.appendChild(ifrm);
    
    // assign url
    ifrm.setAttribute('src', 'https://about.d.tube/legal/'+type+'.html');
    ifrm.setAttribute('width', '100%')
    ifrm.setAttribute('height', '100%')
    ifrm.style.border = 0
}
