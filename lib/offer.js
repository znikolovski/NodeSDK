var Promise = require('bluebird');
var request = require('request');
var rp = require('request-promise');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.config');

function Offer() {
        // always initialize all instance properties
        this.cta = '';
        this.image = ''; // default value
        this.linkPath = '';
        this.description = '';
        this.title = '';
    }


Offer.prototype.getAEMXFOffer = function(offerCode, XFvariant) {
        
    console.log("Getting AEM XF");

    var uri = properties.get('adobe.aem.url') + '/content/experience-fragments/wefinance/offers/en/' + offerCode + '/master.model.json'; 
    
    var options = {
        uri: uri,
        auth: {
            user: 'admin',
            pass: 'admin'
        },
        json: true // Automatically parses the JSON string in the response
    };
    return rp(options);
}

Offer.prototype.formatOffer = function(offer) { 
    var title = offer[':items'].root[':items'].cf_offer.elements.title.value;
    var description = offer[':items'].root[':items'].cf_offer.elements.description.value;
    var cta = offer[':items'].root[':items'].cf_offer.elements.cta.value;
    var linkPath = offer[':items'].root[':items'].cf_offer.elements.linkPath.value;
    var image = offer[':items'].root[':items'].cf_offer.elements.image.value;
    console.log("Offer Title: " + title);
    console.log("Offer description: " + description);
    console.log("Offer cta: " + cta);
    console.log("Offer linkPath: " + linkPath);
    console.log("Offer image: " + image);
    return title;
}




    
module.exports = Offer;