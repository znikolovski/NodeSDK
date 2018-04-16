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

const TARGET_COOKIE = "mbox";
const SESSION_ID_COOKIE = "session";
const DEVICE_ID_COOKIE = "PC";
const LOCATION_HINT_COOKIE = "mboxEdgeCluster";
const HASH = "#";
const PIPE = "|";

function createInternalCookie(name, value, expires) {
  return {name, value, expires};
}

function serializeCookie(cookie) {
  return [encodeURIComponent(cookie.name), encodeURIComponent(cookie.value), cookie.expires].join(HASH);
}

function deserializeCookie(str) {
  const parts = str.split(HASH);
  const len = parts.length;

  if (len === 0 || len < 3) {
    return null;
  }

  if (isNaN(parseInt(parts[2], 10))) {
    return null;
  }

  return createInternalCookie(decodeURIComponent(parts[0]), decodeURIComponent(parts[1]), Number(parts[2]));
}

function getInternalCookies(cookieValue) {
  return cookieValue.split(PIPE);
}

function getExpires(cookie) {
  return cookie.expires;
}

function getMaxExpires(cookies) {
  return Math.max.apply(null, cookies.map(getExpires));
}

function parseCookies(targetCookie) {
  const result = {};

  if (!targetCookie) {
    return result;
  }

  const rawInternalCookies = getInternalCookies(targetCookie);
  const internalCookies = rawInternalCookies.map(x => deserializeCookie(x));
  const nowInSeconds = Math.ceil(Date.now() / 1000);
  const validCookies = internalCookies.filter(cookie => cookie && nowInSeconds <= cookie.expires);

  validCookies.forEach(cookie => result[cookie.name] = cookie);

  return result;
}

function createTargetCookie(cookies) {
  if (cookies.length === 0) {
    return null;
  }

  const now = Date.now();
  const maxAge = Math.abs(getMaxExpires(cookies) * 1000 - now);
  const serializedCookies = cookies.map(x => serializeCookie(x));

  return {
    name: TARGET_COOKIE,
    value: serializedCookies.join(PIPE),
    maxAge: Math.ceil(maxAge / 1000)
  };
}

module.exports = {
  parseCookies,
  createTargetCookie,
  TARGET_COOKIE,
  SESSION_ID_COOKIE,
  DEVICE_ID_COOKIE,
  LOCATION_HINT_COOKIE
};
