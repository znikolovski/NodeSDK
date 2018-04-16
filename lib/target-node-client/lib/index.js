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

const isFunction = require("./common/utils").isFunction;
const throwError = require("./common/utils").throwError;
const Messages = require("./common/messages");
const Visitor = require("./visitor/index");
const Target = require("./target/index");
const NOOP_LOGGER = require("./common/utils").NOOP_LOGGER;

function getLogger(options) {
  if (!options.logger) {
    return NOOP_LOGGER;
  }

  const logger = options.logger;

  if (!isFunction(logger.log)) {
    return NOOP_LOGGER;
  }

  return logger;
}

function createOfferResponse(visitor, response) {
  const visitorState = {visitorState: visitor.getState()};

  return Object.assign({}, visitorState, response);
}

function MarketingCloudClient(config, options) {
  const logger = getLogger(options);
  const organizationId = config.organizationId;

  /**
   * The MarketingCloudClient factory method
   * @param {Object} request
   * @param {String} request.visitorCookie, optional
   * @param {String} request.targetCookie, optional
   * @param {String} request.targetLocationHintCookie, optional
   * @param {String} request.customerIds, optional
   * @param {String} request.payload, required, Target JSON request
   * @param {String} request.visitor, optional for testing only
   * @param {String} request.target, optional for testing only
   */
  this.getOffer = request => {
    const visitorCookie = request.visitorCookie;
    const targetCookie = request.targetCookie;
    const targetLocationHintCookie = request.targetLocationHintCookie;

    const customerIds = request.customerIds;
    const d_mid = request.vars.d_mid;
    const d_blob = request.vars.d_blob;
    const visitorOptions = {organizationId, d_mid, d_blob, visitorCookie};
    const visitor = request.visitor || new Visitor(visitorOptions);
    
    if (customerIds) {
      visitor.setCustomerIDs(customerIds);
    }

    const targetOptions = {visitor, config, logger, targetCookie, targetLocationHintCookie};
    const target = request.target || new Target(targetOptions);
    const payload = request.payload;

    return target.execute(payload).then(res => createOfferResponse(visitor, res));
  };
}

/**
 * The MarketingCloudClient factory method
 * @param {Object} options
 * @param {Object} options.config
 * @param {String} options.config.organizationId
 * @param {String} options.visitorCookie, optional
 * @param {String} options.targetCookie, optional
 * @param {String} options.visitor, optional for testing only
 * @param {String} options.target, optional for testing only
 */
MarketingCloudClient.create = options => {
  if (!options) {
    throwError(Messages.OPTIONS_REQUIRED);
  }

  const config = options.config;

  if (!config) {
    throwError(Messages.CONFIG_REQUIRED);
  }

  const organizationId = config.organizationId;

  if (!organizationId) {
    throwError(Messages.ORG_ID_REQUIRED);
  }

  return new MarketingCloudClient(config, options);
};

MarketingCloudClient.getVisitorCookieName = orgId => Visitor.getCookieName(orgId);
MarketingCloudClient.getTargetCookieName = () => Target.getCookieName();
MarketingCloudClient.getTargetLocationHintCookieName = () => Target.getLocationHintCookieName();
MarketingCloudClient.AuthState = Visitor.AuthState;

module.exports = MarketingCloudClient;
