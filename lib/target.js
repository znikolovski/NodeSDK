var MarketingCloudClient = require("@adobe/target-node-client");

function getLogger() {
    return {
        log: function(...arr) {
            console.log(...arr);
        }
    };
};

function TargetHelper(properties) {
    this.organisationId = '';
    this.suffix = '@AdobeOrg';
    this.client = '';
    this.tntSessions = new Map();
    
    if(!properties.get('adobe.organisationId')) {
        throw new Error('Organisation ID must be set!');
    } else {
        this.organisationId = properties.get('adobe.organisationId');
    };

    if(!properties.get('adobe.client')) {
        throw new Error('Client must be set!');
    } else {
        this.client = properties.get('adobe.client');
    };

    if(properties.get('adobe.suffix')) { this.suffix = properties.get('adobe.suffix'); };

    const config = {
        client: this.client,
        organizationId: this.organisationId,
        suffix: this.suffix,
        timeout: 10000
    };

    const logger = getLogger();
    const options = Object.assign({logger}, {config});
    
    this.marketingCloudClient = MarketingCloudClient.create(options);
};

TargetHelper.getTargetHelper = function(conf) {
    return new TargetHelper(conf);
};

TargetHelper.prototype.getOffer = function(profileParameters, AMCV, mbox, name) {
    const visitorCookieName = encodeURIComponent(MarketingCloudClient.getVisitorCookieName(this.organizationId+this.suffix));
    const targetCookieName = encodeURIComponent(MarketingCloudClient.getTargetCookieName());
    var targetCookie = '';
    if(typeof this.tntSessions.get(name) !== 'undefined' || this.tntSessions.get(name)) {
        targetCookie = this.tntSessions.get(name).targetCookie;
    }
    const payload = {"mbox" : mbox, "profileParameters": profileParameters};
    const vars = {"d_mid": AMCV.d_mid, "d_blob": AMCV.d_blob};
    const targetRequest = Object.assign({payload}, {vars}, {targetCookie});
    return this.marketingCloudClient.getOffer(targetRequest);
};

TargetHelper.prototype.updateTargetCookie = function(cookie, name, AMCV) {
    this.tntSessions.set(name, {'targetCookie': cookie, 'amcv': AMCV});
};

TargetHelper.prototype.getAMCVFromTargetCookie = function(name) {
    if(typeof this.tntSessions.get(name) !== 'undefined') {
        var AMCV = this.tntSessions.get(name).amcv;
        if(AMCV !== null) {
            return AMCV;
        }
    }
    return null;
};

module.exports = TargetHelper;