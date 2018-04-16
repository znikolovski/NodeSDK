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

/*

 AMCV Cookie Format:

 - The cookie starts with a settings digest followed by a | that is a hash of key settings.
 If the settings of the Visitor instance do not match the hash all fields that can expire are force expired
 so they will be re-synced.

 - The rest of the cookie is made up of KEY[-EXPIRATION]|VALUE pairs
 . The KEY will be one of the following fields: MCMID, MCCIDH, MCSYNCS, MCIDTS, MCOPTOUT, MCAID, MCAAMLH and MCAAMB.
 . The -EXPIRATION is optional for each field and if present after the - will be the timestamp for when that field expires.
 The expiration timestamp can also be followed by a "S" flagging that field to also expire
 on a new browser session detected by the presence of the AMCVS_ session cookie.

 */

// Parse into: { settingsDigest: { value: 3213, expire: 0, shouldExpireOnSession: false, hasExpired: false... }}

const PIPE = "|";
const DASH = "-";
const VISITOR_ID_COOKIE_DEFAULT_VALUE = "T";

function isSettingsDigest(part) {
  return part.match(/^[\-0-9]+$/);
}

function retrieveCookies(visitorCookie) {
  const parts = decodeURIComponent(visitorCookie).split(PIPE);

  if (isSettingsDigest(parts[0])) {
    return parts.slice(1);
  }

  return parts;
}

function parseCookies(visitorCookie) {
  if (!visitorCookie || visitorCookie === VISITOR_ID_COOKIE_DEFAULT_VALUE) {
    return {};
  }

  const result = {};
  const now = Date.now();
  const cookies = retrieveCookies(visitorCookie);

  for (let i = 0, l = cookies.length; i < l; i += 2) {
    const [key, expireInMillis = 0] = cookies[i].split(DASH);
    const value = cookies[i + 1];
    const expire = expireInMillis ? parseInt(expireInMillis, 10) : expireInMillis;
    const hasExpired = Boolean(expire > 0 && now >= (expire * 1000));

    if (!hasExpired) {
      result[key] = value;
    }
  }

  return result;
}

module.exports = parseCookies;
