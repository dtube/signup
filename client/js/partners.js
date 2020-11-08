let partnerAdmins = [
    "curator",
    "steeminator3000",
    "heimindanger",
    "french.fyde"
]

function isAdmin() {
    if (partnerAdmins.indexOf($('#username').val().trim().replace('@','')) > -1)
        $("#adminHidden").show()
}

username.onkeydown = isAdmin
username.onchange = isAdmin

loginPartners.onclick = function() {
    hideToasts()
    var inputUsername = $('#username').val().trim().replace('@','')
    var inputKey = $('#priv').val().trim()
    var inputPartner = $("#partner").val().trim().replace('@','')
    var finalUsername = (inputPartner ? inputPartner : inputUsername)
    let tx = {
        type: 1001,
        data: {
            message: 'login dtube partner',
            partner: finalUsername
        }
    }
    try {
        tx = javalon.sign(inputKey, inputUsername, tx)
    } catch (error) {
        toastError(error)
        return
    }

    axios({
        method: "POST",
        timeout: 15000,
        url: "/refStats",
        data: {
            sign: tx
        }
    }).then(function(data) {
        $("#front").hide()
        $("#refStats").show()
        let accounts = data.data.accounts
        if (!accounts || accounts.length == 0) {
            $("#refStats").append("<h4>No user onboarded by @"+finalUsername+" yet.</h4>")
            return
        }

        $("#refStats").prepend("<h4>Onboarding statistics for @"+finalUsername+"</h4>")

        let html = "<tbody>"
        for (let i = 0; i < accounts.length; i++) {
            html += "<tr>"
            html += "<td>"+new Date(accounts[i].startTime).toLocaleDateString()+"</td>"
            html += "<td>"+accounts[i].email+"</td>"

            if (!accounts[i].facebook) html += "<td></td>"
            else if (accounts[i].facebook == "skip")
                html += "<td>❌</td>"
            else
                html += "<td>✅</td>"

            if (!accounts[i].phone) html += "<td></td>"
            else if (accounts[i].phone == "skip")
                html += "<td>❌</td>"
            else
                html += "<td>✅</td>"

            if (!accounts[i].optin) html += "<td></td>"
            else if (accounts[i].optin == "skip")
                html += "<td>❌</td>"
            else
                html += "<td>✅</td>"

            if (accounts[i].username)
                html += "<td>"+accounts[i].username+"</td>"
            else
                html += "<td></td>"

            if (!accounts[i].finalized || accounts[i].finalized == "skip")
                html += "<td>❌</td>"
            else
                html += "<td>✅</td>"

            html += "</tr>"
        }
        html += "</tbody>"
        $("#refStatsTable").show()
        $("#refStatsTable").append(html)
    }).catch(function(err, data) {
        console.log(err)
        toastError(err)
    })
}