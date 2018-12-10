var jwt = require('jwt-simple');
var rp = require('request-promise');

var AdobeConfig = {};

function JWT(properties, services) {
    var organisationId = properties.get('adobe.organisationId');
    if(!organisationId) {
        throw new Error('Organisation ID must be set!');
    }

    var technicalAccount = properties.get('adobe.technicalAcc');
    if(!technicalAccount) {
        throw new Error('Technical Account must be set');
    }

    var apiKey = properties.get('adobe.api.key');
    if(!apiKey) {
        throw new Error('API Key must be set');
    }

    var clientSecret = properties.get('adobe.client.secret');
    if(!clientSecret) {
        throw new Error('Client Secret must be set');
    }

    var suffix = properties.get('adobe.suffix');
    if(!suffix) {
        suffix = '@AdobeOrg';
    }

    var payload = {
        'exp': Math.round(87000 + Date.now()/1000),
        "iss" : organisationId + suffix,
        "sub" : technicalAccount,
        "aud" : "https://ims-na1.adobelogin.com/c/" + apiKey,
    };

    payload = Object.assign({}, payload, services);

    this.AdobeConfig = {
        payload: payload,
        pem: '',
        algorithm: 'RS256'
    };
};

JWT.prototype.getToken = function(properties) {
    var pkey = properties.get('adobe.private.key');
    pkey = pkey.split(",");
    const privateKey = pkey.join('\r\n');

    this.AdobeConfig.pem = privateKey;
    return jwt.encode(this.AdobeConfig.payload, this.AdobeConfig.pem, this.AdobeConfig.algorithm);
};

JWT.prototype.validateToken = function(properties, jwt) {
    try{
        var decoded = jwt.decode(jwt, this.AdobeConfig.pem, this.AdobeConfig.algorithm);
        return true;
    } catch(err){
        return false;
    }
};

JWT.prototype.exchangeToken = function(token, properties) {
    var options = {
        method: 'POST',
        uri: 'https://ims-na1.adobelogin.com/ims/exchange/jwt/',
        body: {
            client_id: properties.get('adobe.api.key'),
            client_secret: properties.get('adobe.client.secret'),
            jwt_token: token
        },
        json: true // Automatically stringifies the body to JSON
    };

    return rp(options);
    
};

module.exports = JWT;