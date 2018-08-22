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

const isObject = require("../common/utils").isObject;
const objectToParams = require("../common/utils").objectToParams;

const VISITOR_ID_KEY = "marketingCloudVisitorId";
const BLOB_PARAM = "mboxAAMB";
const LOCATION_HINT_PARAM = "mboxMCGLH";
const SUPPLEMENTAL_DATA_ID_PARAM = "mboxMCSDID";
const VST_PREFIX = "vst.";

function buildKey(key) {
  return VST_PREFIX + key;
}

function getCustomerIdsParameters(visitor) {
  const customerIds = visitor.getCustomerIDs();

  if (!isObject(customerIds)) {
    return {};
  }

  return objectToParams(customerIds, buildKey);
}

function getVisitorParams(visitor, mbox) {
  const visitorId = visitor.getMarketingCloudVisitorID();
  const blob = visitor.getAudienceManagerBlob();
  const locationHint = visitor.getAudienceManagerLocationHint();
  const supplementalDataId = visitor.getSupplementalDataID(mbox);
  const result = {
    mboxParameters: {}
  };

  if (visitorId) {
    result[VISITOR_ID_KEY] = visitorId;
  }

  if (blob) {
    result.mboxParameters[BLOB_PARAM] = blob;
  }

  if (locationHint) {
    result.mboxParameters[LOCATION_HINT_PARAM] = locationHint;
  }

  result.mboxParameters[SUPPLEMENTAL_DATA_ID_PARAM] = supplementalDataId;
  result.mboxParameters = Object.assign(result.mboxParameters, getCustomerIdsParameters(visitor));

  return result;
}

module.exports = {
  getVisitorParams,
  VISITOR_ID_KEY,
  SUPPLEMENTAL_DATA_ID_PARAM,
  BLOB_PARAM,
  LOCATION_HINT_PARAM
};
