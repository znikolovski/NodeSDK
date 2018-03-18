/*--------------------------------------------------------------------------------
A Node.JS wrapper for the Adobe Marketing Cloud client APIs for AAM, AA and Target 
---------------------------------------------------------------------------------*/

var AAMHelper = require('./lib/audiencemanager');
var TargetHelper = require('./lib/target');
var AnalyticsHelper = require('./lib/analytics');
var JWT = require('./lib/jwt');

var PropertiesReader = require('properties-reader');

var AA = null;
var AAM = null;
var Target = null;
var JWT = null;

function returnAA() {
    return this.AA;
}

function returnAAM() {
    return this.AAM;
}

function returnTarget() {
    return this.Target;
}

function returnJWT() {
    return this.JWT;
}

function MarketingCloudClient() {
    this.getAA = () => {
        return returnAA();
    };

    this.getAAM = () => {
        return returnAA();
    };

    this.getTarget = () => {
        return returnAA();
    };

    this.getJWT = () => {
        return returnJWT();
    }
};

MarketingCloudClient.create = properties => {
    if (!properties) {
        throwError('A properties reference must be provided');
    }

    this.AA = new AnalyticsHelper(properties);
    this.AAM = new AAMHelper(properties);
    this.Target = new TargetHelper(properties);
    this.JWT = new JWT(properties);

    return new MarketingCloudClient();
}

module.exports = MarketingCloudClient;

