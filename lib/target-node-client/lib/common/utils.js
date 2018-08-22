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

const PERIOD = ".";
const NOOP_LOGGER = {
  log: function () {}
};

function isUndefined(value) {
  return undefined === value;
}

function isObject(value) {
  return "object" === typeof(value);
}

function isFunction(value) {
  return "function" === typeof(value);
}

function isEmptyArray(value) {
  return Array.isArray(value) && 0 === value.length;
}

function identity(value) {
  return value;
}

function objectToParamsInternal(obj, keys, result, keyFunc) {
  const objKeys = Object.keys(obj);

  objKeys.forEach(key => {
    const value = obj[key];

    if (isObject(value)) {
      keys.push(key);
      objectToParamsInternal(value, keys, result, keyFunc);
      keys.pop();
    } else if (isEmptyArray(keys)) {
      result[keyFunc(key)] = value;
    } else {
      result[keyFunc(keys.concat(key).join(PERIOD))] = value;
    }
  });
}

function objectToParams(obj, keyFunc) {
  const result = {};

  if (!obj) {
    return result;
  }

  if (isUndefined(keyFunc)) {
    objectToParamsInternal(obj, [], result, identity);
  } else {
    objectToParamsInternal(obj, [], result, keyFunc);
  }

  return result;
}

function throwError(msg) {
  throw new Error(msg);
}

module.exports = {
  isObject,
  isFunction,
  objectToParams,
  throwError,
  NOOP_LOGGER
};
