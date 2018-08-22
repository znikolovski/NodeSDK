'use strict';
var _ = require('lodash');
var requestPromise = require('request-promise');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.config');

function ProfileHelper() {
}

/**
 * Requires the Profile extension in ACS to have a byEmail filter configured
 * 
 * @param {*} profileEmail 
 * @param {*} access_token 
 */
ProfileHelper.prototype.getProfileByEmail = function(profileEmail, access_token) {

    var campaignuri = properties.get('adobe.campaign.host') + '/campaign/profileAndServicesExt/profile/byEmail?email=' + encodeURIComponent(profileEmail);
    var auth_key = "Bearer " + access_token;
    var api_key = properties.get('adobe.api.key')
 
    var headers = {
        "Authorization" :auth_key ,
        "X-Api-Key" : api_key,
        "Cache-Control" : "no-cache"
    }
 
    var options = {
        method: 'GET',
        uri: campaignuri,
        json: true,
        headers: headers
    };
     
     console.log(options);
     
    
    return requestPromise(options);
};
 
module.exports = ProfileHelper;