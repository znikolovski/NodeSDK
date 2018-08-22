var rp = require('request-promise');
const _ = require("lodash");
const MCMID = 'MCMID';
const MCORGID = 'MCORGID';
const NONE = 'NONE';

function AAMHelper(properties) {
    // always initialize all instance properties
    this.baseUrl = 'https://dpm.demdex.net';
    this.organisationId = '';
    this.customerId = '';
    this.dataSourceId = '';

    if(properties.get('adobe.aam.baseUrl')) {
        this.baseUrl = properties.get('adobe.aam.baseUrl');
    };

    if(!properties.get('adobe.organisationId')) {
        throw new Error('Organisation ID must be set!');
    } else {
        this.organisationId = properties.get('adobe.organisationId');
    };

    if(!properties.get('adobe.dataSourceId')) {
        throw new Error('Data Source Id must be set!');
    } else {
        this.dataSourceId = properties.get('adobe.dataSourceId');
    };

};

AAMHelper.getAAMHelper = function(conf) {
    return new AAMHelper(conf);
};

AAMHelper.prototype.getVisitorId = function(customerIds = {}, authState = 2) {
    uri = '/id?d_orgid='+this.organisationId+'%40AdobeOrg&d_ver=2';

    if(customerIds !== {}) {
        _.keys(customerIds).forEach(key => {
            const value = customerIds[key];
        
            if (!_.isNil(value.id)) {
                uri = "&" + this.dataSourceId + "%01" + value.id;
            }
        
            if (!_.isNil(value.authState)) {
                uri = uri + "%01" + value.authState;
            } else if(!_.isNil(value.id)) {
                uir = uri + "%01" + authState;
            }
        });
    }

    var options = {
        baseUrl: this.baseUrl,
        uri: uri,
        method: 'GET',
        json: true
    };

    return rp(options);
};

AAMHelper.prototype.setCustomerId = function(d_mid, cid, region, query = {}, authState = 1) {
    // Set default query string parameters
    const qs = {
        d_orgid: this.organisationId,
        dcs_region: region,
        d_mid: d_mid,
        d_ptfm: 'all',
        d_rtbd: 'json',
        d_cid: this.dataSourceId + '%01' + cid + '%01' + authState,
        d_cts: 2
    };

    // Merge with user provided query string
    query = Object.assign({}, query, qs);

    const options = {
        baseUrl: this.baseUrl,
        uri: '/event',
        qs: query,
        method: 'GET',
        json: true
    };

    return new Promise((resolve, reject) => rp(options).then(resolve, reject));
};

AAMHelper.prototype.appendVisitorIDsTo = function(mid, marketingCloudORD, url) {
    
    try {
        var fields = [[MCMID, mid],
                      [MCORGID, marketingCloudORD]];
        
        return _addQuerystringParam(url, 'adobe_mc', generateAdobeMcParam(fields));
    } catch (ex) {
        console.log(ex);
        return url;
    }
};

function generateAdobeMcParam(fields) { // fields: array of tuples.
    function appendToMcParam(key, value, mcParam) {
        mcParam = mcParam ? (mcParam += "|") : mcParam;
        mcParam += key + "=" + encodeURIComponent(value);
        return mcParam;
    }

    function appendCreationTimestamp(mcParam) {
        var ts = Math.round(new Date().getTime() / 1000); // Timestamp in seconds.
        mcParam = mcParam ? (mcParam += "|") : mcParam;
        mcParam += "TS=" + ts;
        return mcParam;
    }

    function generateMcParam(mcParam, fieldTokens) {
        var key = fieldTokens[0];
        var value = fieldTokens[1];

        if (value != null && value !== NONE) {  // eslint-disable-line eqeqeq
            mcParam = appendToMcParam(key, value, mcParam);
        }

        return mcParam;
    }

    var mcParam = fields.reduce(generateMcParam, "");
    return appendCreationTimestamp(mcParam);
};

function _addQuerystringParam(url, key, value, location) {
    var param = encodeURIComponent(key) + "=" + encodeURIComponent(value);

    // Preserve any existing hashes.
    var hashIndex = url.indexOf("#");
    var hash = hashIndex > 0 ? url.substr(hashIndex) : "";
    var urlWithoutHash =  hashIndex > 0 ? url.substr(0, hashIndex) : url;

    var hasNoQuerystring = urlWithoutHash.indexOf("?") === -1;
    if (hasNoQuerystring) {
        return urlWithoutHash + "?" + param + hash;
    }

    var urlParts = urlWithoutHash.split("?");
    var host = urlParts[0] + "?";
    var querystring = urlParts[1];

    var params = addQueryParamAtLocation(querystring, param, location);

    return host + params + hash;
};

function addQueryParamAtLocation(querystring, param, location) {
    var params = querystring.split("&");
    location = location != null ? location : params.length;  // eslint-disable-line eqeqeq
    params.splice(location, 0, param);

    return params.join("&");
};

module.exports = AAMHelper;