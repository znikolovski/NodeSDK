'use strict';
var requestPromise = require('request-promise');
var properties = null;

function CampaignHelper(props) {
    properties = props;
}

CampaignHelper.prototype.sendEmail = function(emailid, intent, access_token, emailPath, emailBody) {
    
    console.log("Sending email.. if ACS works...");

    var ENDPOINT = properties.get('adobe.campaign.host') + emailPath;
    var auth_key = "Bearer " + access_token;
    var api_key = properties.get('adobe.api.key')
 
    var headers = {
        "Authorization" :auth_key ,
        "X-Api-Key" : api_key,
        "Cache-Control" : "no-cache"
    }

    var options = {
        method: 'POST',
        uri: ENDPOINT,
        json: true,
        headers: headers,
        body: emailBody
    };
     
     console.log(options);
     
    
    return requestPromise(options);
};


module.exports = CampaignHelper;