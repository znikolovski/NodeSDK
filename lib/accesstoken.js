var fs = require('fs');
var rp = require('request-promise');

function AccessTokenHelper(properties) {
    this.apiKey = properties.get('adobe.api.key');
    if(!this.apiKey) {
        throw new Error('API Key must be set');
    }

    this.clientSecret = properties.get('adobe.client.secret');
    if(!this.clientSecret) {
        throw new Error('Client Secret must be set');
    }

    this.JWT = properties.get('adobe.jwt');
    if(!this.JWT) {
        throw new Error('JWT must be set');
    }
}

AccessTokenHelper.prototype.getToken = function(jwt) {
    if(jwt !== void 0) {
        this.JWT = jwt;
    }
    
    const formdata = {
        client_id: this.apiKey,
        client_secret: this.clientSecret,
        jwt_token: this.JWT
    }
    
    const options = {
        method: 'POST',
        uri: 'https://ims-na1.adobelogin.com/ims/exchange/jwt',
        formData: formdata,
        json: true
    };

    return rp(options);
};

AccessTokenHelper.prototype.formatToken = async function(token) {
     return token.access_token;
 };

module.exports = AccessTokenHelper;