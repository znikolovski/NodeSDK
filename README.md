# NodeSDK
A Node.JS wrapper for the Adobe Marketing Cloud client APIs for AAM, AA and Target, Campaign and Profile Services

## Configure NodeSDK
1. Clone the repository
2. Run 'npm install'
3. Create a properties file (copy to provided properties.config.example file and modify as required)

## Using the NodeSDK
```
const adobeClient = new MarketingCloudClient();
const analyticsService = adobeClient.getAA();
const aamService = adobeClient.getAAM();
const targetService = adobeClient.getTarget();

let vid = await aamService.getVisitorId();
const eVars = {
    eVar3: "value",
};
const data = {
    marketingCloudVisitorID: vid.d_mid,
    visitorID: vid.d_mid,
    referrer: 'referrer',
    pageName: 'Page Name',
    channel: 'Channel',
    eVar: eVars,
};
analyticsService.track(data);
```

## Adobe Helpers
These helper objects wrap each of our products/services. The intent is that through the methods that the helpers expose any server-side application (e.g. ChatBot, Alexa Skill, Google Action) can achieve parity with a web page.

The configuration required for each of the helpers lives in the properties.config file.

The following helpers are available out of the box:
1. JWT - this generates a JW Token for Adobe I/O integrations based on the private key provided in properties.config
2. AccessToken - this generates an access token based on the JWT token that was generated
3. AudienceManager - the Audience Manager/Visitor Service helper exposes functionality to:
- Generate an ECVID
- Set a Declared ID
- Qualify user for a segment
4. Analytics - generating an analytics beacon reporting call through the Data Insertion API
5. Target - the Target helper exposes two methods
- getActivityContent if your activity uses Audience Manager segments
- getOffer if your activity uses Profile parameters
6. Campaign - Use ACS Transaction API to send an email (requires an ACS instance attached to your AMC and an Adobe I/O integration with the Campaign service setup)
7. Profile - Fetch a customer profile from ACS' Profile and Services Extension API (requires an ACS instance attached to your AMC and an Adobe I/O integration with the Campaign service setup)

### Certificates and authentication
1. Assumes you have a valid Adobe I/O integration configured and details are stored in properties.config
2. Assumes you have a private.key associated with the integration. The private key will need to be stored in the properties.config file (under private.key) as a comma-separated value (each line in the private.key file)
