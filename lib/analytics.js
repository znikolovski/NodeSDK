'use strict';
var adobeAnalyticsHelper = require('adobe-analytics-di');

function AnalyticsHelper(properties) {
    adobeAnalyticsHelper.setReportingSuiteId(properties.get('adobe.analytics.reportSuite'));
}

AnalyticsHelper.prototype.track = function(callData) {
    var myDi = adobeAnalyticsHelper.getDataInsertion(callData);
    
    if (myDi != null) {
        adobeAnalyticsHelper.sendCallToAdobeAnalytics(myDi);
    };
    
};

module.exports = AnalyticsHelper;
