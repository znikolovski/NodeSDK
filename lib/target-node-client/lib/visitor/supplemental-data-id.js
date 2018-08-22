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

const generateRandomId = require("./random-id");

const CURRENT_KEY = "supplementalDataIDCurrent";
const CURRENT_CONSUMED_KEY = "supplementalDataIDCurrentConsumed";
const LAST_KEY = "supplementalDataIDLast";
const LAST_CONSUMED_KEY = "supplementalDataIDLastConsumed";

function generateSupplementalDataId() {
  return generateRandomId(1);
}

// This factory will generate a SupplementalDataID object that exposes 2 methods:
// - getSupplementalDataId: Main method that generates/retrieves a supplemental data ID.
// - getState: Returns the internal state of the object.
function createSupplementalDataId(previousState) {
  previousState = previousState || {};

  let currentId = previousState[CURRENT_KEY] || "";
  let currentConsumed = previousState[CURRENT_CONSUMED_KEY] || {};
  let lastId = previousState[LAST_KEY] || "";
  let lastConsumed = previousState[LAST_CONSUMED_KEY] || {};

  function getSupplementalDataId(consumerId, noGenerate) {
    // If we don"t have a current supplemental-data ID generate one if needed
    if (!currentId && !noGenerate) {
      currentId = generateSupplementalDataId();
    }

    // Default to using the current supplemental-data ID
    let supplementalDataId = currentId;

    // If we have the last supplemental-data ID that has not been consumed by this consumer...
    if (lastId && !lastConsumed[consumerId]) {
      // Use the last supplemental-data ID
      supplementalDataId = lastId;
      // Mark the last supplemental-data ID as consumed for this consumer
      lastConsumed[consumerId] = true;

      // If we are using te current supplemental-data ID at this point and we have a supplemental-data ID...
    } else if (supplementalDataId) {
      // If the current supplemental-data ID has already been consumed by this consumer..
      if (currentConsumed[consumerId]) {
        // Move the current supplemental-data ID to the last including the current consumed list
        lastId = currentId;
        lastConsumed = currentConsumed;
        // Generate a new current supplemental-data ID if needed, use it, and clear the current consumed list
        currentId = supplementalDataId = (!noGenerate ? generateSupplementalDataId() : "");
        currentConsumed = {};
      }

      // If we still have a supplemental-data ID mark the current supplemental-data ID as consumed by this consumer
      if (supplementalDataId) {
        currentConsumed[consumerId] = true;
      }
    }

    return supplementalDataId;
  }

  return {
    getId: getSupplementalDataId,
    getState: function (){
      const result = {};
      result[CURRENT_KEY] = currentId;
      result[CURRENT_CONSUMED_KEY] = currentConsumed;
      result[LAST_KEY] = lastId;
      result[LAST_CONSUMED_KEY] = lastConsumed;

      return result;
    }
  };
}

module.exports = createSupplementalDataId;
