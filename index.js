/*--------------------------------------------------------------------------------
A Node.JS wrapper for the Adobe Marketing Cloud client APIs for 
AAM, AA and Target, Campaign and Profile Services 
---------------------------------------------------------------------------------*/

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.config');

var JWT = require('./lib/jwt');
var AccessTokenHelper = require('./lib/accesstoken');
var AnalyticsHelper = require('./lib/analytics');
var CampaignHelper = require('./lib/campaign');
var ProfileHelper = require('./lib/profile');
var TargetHelper = require('./lib/target');
var AudienceManagerHelper = require('./lib/audiencemanager');

// The services configured with your Adobe.IO integration. Remove the ones that you don't need before proceeding
var services = {
    "https://ims-na1.adobelogin.com/s/ent_reactor_admin_sdk": true,
   "https://ims-na1.adobelogin.com/s/ent_analytics_bulk_ingest_sdk": true,
   "https://ims-na1.adobelogin.com/s/ent_sensei_image_sdk": true,
   "https://ims-na1.adobelogin.com/s/ent_user_sdk": true,
   "https://ims-na1.adobelogin.com/s/ent_adobeio_sdk": true,
   "https://ims-na1.adobelogin.com/s/ent_campaign_sdk": true,
   "https://ims-na1.adobelogin.com/s/ent_marketing_sdk": true,
   "https://ims-na1.adobelogin.com/s/event_receiver_api": true,
};

var AA = null;
var AAM = null;
var Target = null;
var JWT = null;
var AccessToken = null;
var Campaign = null;
var Profile = null;

function returnAnalyticsService() {
    return this.AA;
};

function returnAudienceManagerService() {
    return this.AAM;
};

function returnTargetService() {
    return this.Target;
};

function returnJWTService() {
    return this.JWT;
};

function returnAccessTokenService() {
    return this.AccessToken;
};

function returnCampaignService() {
    return this.Campaign;
};

function returnProfileService() {
    return this.Profile;
};

function MarketingCloudClient() {
    this.getAA = () => {
        return returnAnalyticsService();
    };

    this.getAAM = () => {
        return returnAudienceManagerService();
    };

    this.getTarget = () => {
        return returnTargetService();
    };

    this.getJWT = () => {
        return returnJWTService();
    };

    this.getAccessToken = () => {
        return returnAccessTokenService();
    };

    this.getCampaign = () => {
        if(!JWT && !AccessToken) {
            throwError('The Campaign Service requires a valid Adobe I/O configuration')
        }
        return returnCampaignService();
    };

    this.getProfile = () => {
        if(!JWT && !AccessToken) {
            throwError('The Profile Service requires a valid Adobe I/O configuration')
        }

        return returnProfileService();
    };
};

MarketingCloudClient.prototype.create = properties, services => {
    if (!properties) {
        throwError('A properties reference must be provided');
    }

    if(services) {
        this.JWT = new JWT(properties, services);
        this.AccessToken = new AccessTokenHelper(properties);
    }

    this.Campaign = new CampaignHelper(properties);
    this.Profile = new ProfileHelper();
    this.AA = new AnalyticsHelper(properties);
    this.AAM = new AAMHelper(properties);
    this.Target = new TargetHelper(properties);

    return new MarketingCloudClient();
}

module.exports = MarketingCloudClient;

