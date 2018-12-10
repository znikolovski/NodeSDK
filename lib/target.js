var rp = require('request-promise');

const path = require('path'),
MarketingCloudClient = require(path.join(__dirname, 'target-node-client', 'lib', 'index.js'));

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
    this.dataSourceIntegrationCode = '';
    this.tenant = '';
    
    if(!properties.get('adobe.organisationId')) {
        throw new Error('Organisation ID must be set!');
    } else {
        this.organisationId = properties.get('adobe.organisationId');
    };

    if(!properties.get('adobe.tenant')) {
        throw new Error('Tenant must be set!');
    } else {
        this.tenant = properties.get('adobe.tenant');
    };

    if(!properties.get('adobe.client')) {
        throw new Error('Client must be set!');
    } else {
        this.client = properties.get('adobe.client');
    };

    if(properties.get('adobe.dataSourceIntegrationCode')) {
        this.dataSourceIntegrationCode = properties.get('adobe.dataSourceIntegrationCode');
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

TargetHelper.prototype.getActivityContent = function(mbox, visitor, declaredId, profileParameters, authState = 2) {
    var body = {
        "mbox": mbox,
        "mboxParameters" : {}
    };

    // If there is a visitor object passed in add the visitor information to the request body
    if(visitor !== void 0) {
        body["marketingCloudVisitorId"] = visitor.d_mid,
        body.mboxParameters["mboxAAMB"] = visitor.d_blob;
        body.mboxParameters["mboxMCGLH"] = visitor.dcs_region;

        body.mboxParameters["vst."+this.dataSourceIntegrationCode+"_id.id"] = declaredId;
        body.mboxParameters["vst."+this.dataSourceIntegrationCode+"_id.authState"] = authState;
    }

    if(profileParameters !== void 0) {
        body["profileParameters"] = profileParameters;
    }

    uri = "/rest/v1/mbox/" + new Date().getTime() + "?client="+this.client;

    const options = {
        baseUrl: 'https://' + this.tenant + '.tt.omtrdc.net',
        uri: uri,
        body: body,
        method: 'POST',
        json: true
    };

    return new Promise((resolve, reject) => rp(options).then(resolve, reject));
};

/**
 * @deprecated since version 0.2.0
 */
TargetHelper.prototype.getOffer = function(profileParameters, AMCV, mbox, customerID, name) {
    const visitorCookieName = encodeURIComponent(MarketingCloudClient.getVisitorCookieName(this.organizationId+this.suffix));
    const targetCookieName = encodeURIComponent(MarketingCloudClient.getTargetCookieName());
    var targetCookie = '';
    if(typeof this.tntSessions.get(name) !== 'undefined' || this.tntSessions.get(name)) {
        targetCookie = this.tntSessions.get(name).targetCookie;
    }
    const payload = {"mbox" : mbox, "profileParameters": profileParameters};
    const vars = {"d_mid": AMCV.d_mid, "d_blob": AMCV.d_blob, "customerId": customerID};
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