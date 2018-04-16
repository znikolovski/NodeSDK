var rp = require('request-promise');
const MCMID = 'MCMID';
const MCORGID = 'MCORGID';
const NONE = 'NONE';

function AAMHelper(properties) {
    // always initialize all instance properties
    this.baseUrl = 'https://dpm.demdex.net';
    this.organisationId = '';
    this.customerId = '';

    if(!properties.get('adobe.organisationId')) {
        throw new Error('Organisation ID must be set!');
    } else {
        this.organisationId = properties.get('adobe.organisationId');
    };
};

AAMHelper.getAAMHelper = function(conf) {
    return new AAMHelper(conf);
};

AAMHelper.prototype.getVisitorId = function() {
    var options = {
        baseUrl: this.baseUrl,
        uri: '/id?d_orgid='+this.organisationId+'%40AdobeOrg&dcs_region=6&d_ver=2',
        method: 'GET',
        json: true
    };

    return rp(options);
};

AAMHelper.prototype.setCustomerId = function(d_mid, cid) {
    var options = {
        baseUrl: this.baseUrl,
        uri: '/event?d_orgid='+this.organisationId+'%40AdobeOrg&d_mid='+d_mid+'&dcs_region=6&d_ptfm=all&d_rtbd=json&d_cid=126125%01'+cid+'%011&d_cts=2',
        method: 'GET',
        json: true
    };

    return rp(options);
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