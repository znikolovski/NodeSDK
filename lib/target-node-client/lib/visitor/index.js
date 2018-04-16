/*************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2017 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by all applicable intellectual property
 * laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

const throwError = require("../common/utils").throwError;
const Messages = require("../common/messages");
const AuthState = require("./auth-state");
const createSupplementalDataId = require("./supplemental-data-id");
const parseCookies = require("./visitor-cookies");

const AMCV_PREFIX = "AMCV_";
const VISITOR_ID = "MCMID";
const BLOB = "MCAAMB";
const LOCATION_HINT = "MCAAMLH";

/**
 * The Visitor class
 * @param {Object} options
 * @param {String} options.organizationId
 * @param {String} options.visitorCookie, optional
 */
function Visitor(options) {
  if (!options) {
    throwError(Messages.OPTIONS_REQUIRED);
  }

  const organizationId = options.organizationId;

  if (!organizationId) {
    throwError(Messages.ORG_ID_REQUIRED);
  }

  let state = {};
  const visitorCookie = options.visitorCookie;
   
  const supplementalDataId = createSupplementalDataId();

  var cookies = parseCookies(visitorCookie);

  var visitorId = cookies[VISITOR_ID];
  if(typeof visitorId === 'undefined' || !visitorId) {
    visitorId = options.d_mid;
  }
  var blob = cookies[BLOB];
  if(typeof blob === 'undefined' || !blob) {
    blob = options.d_blob;
  }

  const setState = valueObj => {
    state = Object.assign({}, state, valueObj);
  };

  this.getMarketingCloudVisitorID = () => visitorId;

  this.getAudienceManagerBlob = () => blob;

  this.getAudienceManagerLocationHint = () => cookies[LOCATION_HINT];

  this.getSupplementalDataID = (consumerId = throwError(Messages.CONSUMER_ID_REQUIRED)) => {
    const sdid = supplementalDataId.getId(consumerId);

    setState({sdid: supplementalDataId.getState()});

    return sdid;
  };

  this.getCustomerIDs = () => {
    return state.customerIDs;
  };

  this.setCustomerIDs = (customerIDs = {}) => {
    setState({customerIDs});
  };

  this.getState = () => {
    return {[organizationId]: state};
  };
}

Visitor.AuthState = AuthState;
Visitor.getCookieName = organizationId => AMCV_PREFIX + organizationId;

module.exports = Visitor;
