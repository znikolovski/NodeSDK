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

const request = require("request");
const uuid = require("uuid").v4;
const Messages = require("../common/messages");
const throwError = require("../common/utils").throwError;
const getVisitorParams = require("./visitor-params").getVisitorParams;
const parseCookies = require("./target-cookies").parseCookies;
const createTargetCookie = require("./target-cookies").createTargetCookie;
const TARGET_COOKIE = require("./target-cookies").TARGET_COOKIE;
const SESSION_ID_COOKIE = require("./target-cookies").SESSION_ID_COOKIE;
const DEVICE_ID_COOKIE = require("./target-cookies").DEVICE_ID_COOKIE;
const LOCATION_HINT_COOKIE = require("./target-cookies").LOCATION_HINT_COOKIE;
const VISITOR_ID_KEY = require("./visitor-params").VISITOR_ID_KEY;

const EDGE_CLUSTER_PREFIX = "mboxedge";
const HOST = "tt.omtrdc.net";
const PATH = "/rest/v1/mbox/";
const PROTOCOL = "http://";
const SECURE_PROTOCOL = "https://";
const TIMEOUT = 3000;
const DEVICE_ID_KEY = "tntId";
const SESSION_ID_KEY = "sessionId";
const CONTENT_KEY = "content";
const EDGE_HOST_KEY = "edgeHost";
const SESSION_ID_MAX_AGE = 1860;
const DEVICE_ID_MAX_AGE = 63244800;
const LOCATION_HINT_MAX_AGE = 1860;
const AT_PREFIX = "AT:";
const REQUEST_SENT = "request sent";
const RESPONSE_RECEIVED = "response received";

function extractClusterFromDeviceId(id) {
  if (!id) {
    return null;
  }

  const parts = id.split(".");

  if (parts.length !== 2 || !parts[1]) {
    return null;
  }

  const nodeDetails = parts[1].split("_");

  if (nodeDetails.length !== 2 || !nodeDetails[0]) {
    return null;
  }

  return nodeDetails[0];
}

function extractClusterFromEdgeHost(host) {
  if (!host) {
    return null;
  }

  const parts = host.split(".");

  if (parts.length !== 4 || !parts[0]) {
    return null;
  }

  return parts[0].replace(EDGE_CLUSTER_PREFIX, "");
}

function getCluster(deviceId, cluster) {
  return extractClusterFromDeviceId(deviceId) || cluster;
}

function getHost(cluster, client) {
  if (cluster) {
    return `${EDGE_CLUSTER_PREFIX}${cluster}.${HOST}`;
  }

  return `${client}.${HOST}`;
}

function getSessionId(cookies) {
  const cookie = cookies[SESSION_ID_COOKIE];
  const id = uuid().toString().replace(/-/g, "");

  if (!cookie) {
    return id;
  }

  const sessionId = cookie.value;

  return sessionId || id;
}

function getDeviceId(cookies) {
  const cookie = cookies[DEVICE_ID_COOKIE];

  if (!cookie) {
    return null;
  }

  return cookie.value;
}

function executeRequest(http, request) {
  return new Promise((resolve, reject) => {
    http.post(request, function (error, response, body) {
      if (error) {
        reject(error);
        return;
      }

      if (response.statusCode !== 200) {
        reject(body);
        return;
      }

      resolve(body);
    });
  });
}

function createRequest(client, protocol, timeout, sessionId, deviceId, cluster, request, visitor) {
  const host = getHost(cluster, client);
  const json = Object.assign({}, request);
  const visitorParams = getVisitorParams(visitor, request.mbox);
  json[DEVICE_ID_KEY] = deviceId || undefined;
  json[VISITOR_ID_KEY] = visitorParams[VISITOR_ID_KEY] || undefined;
  json.mboxParameters = Object.assign(json.mboxParameters || {}, visitorParams.mboxParameters);
  json.mboxParameters.mboxMCGVID = json[VISITOR_ID_KEY];
  json.mboxParameters.mboxXDomain = "enabled";

  return {
    uri: `${protocol}${host}${PATH}${sessionId}`,
    timeout: timeout,
    qs: {client},
    json: json
  };
}

function processResponse(cluster, response) {
  const result = {};
  const sessionId = response[SESSION_ID_KEY];
  const deviceId = response[DEVICE_ID_KEY];
  const content = response[CONTENT_KEY];
  const nowInSeconds = Math.ceil(Date.now() / 1000);
  const cookies = [];
  cluster = cluster || extractClusterFromEdgeHost(response[EDGE_HOST_KEY]);

  if (sessionId) {
    cookies.push({
      name: SESSION_ID_COOKIE,
      value: sessionId,
      expires: nowInSeconds + SESSION_ID_MAX_AGE
    });
  }

  if (deviceId) {
    cookies.push({
      name: DEVICE_ID_COOKIE,
      value: deviceId,
      expires: nowInSeconds + DEVICE_ID_MAX_AGE
    });
  }

  if (content) {
    result.content = content;
  }

  const targetCookie = createTargetCookie(cookies);

  if (targetCookie) {
    result.targetCookie = targetCookie;
  }

  if (cluster) {
    result.targetLocationHintCookie = {
      name: LOCATION_HINT_COOKIE,
      value: cluster,
      maxAge: LOCATION_HINT_MAX_AGE
    };
  }

  return result;
}

/**
 * The Target class
 * @param {Object} options
 * @param {Object} options.visitor
 * @param {String} options.targetCookie, optional
 * @param {String} options.targetLocationHintCookie, optional
 * @param {Object} options.http, optional mostly used for testing
 * @param {Object} options.config
 * @param {Object} options.logger
 * @param {String} options.config.client
 * @param {String} options.config.host
 * @param {Boolean} options.config.secure
 * @param {Number} options.config.timeout
 */
function Target(options) {
  if (!options) {
    throwError(Messages.OPTIONS_REQUIRED);
  }

  const http = options.http || request;
  const visitor = options.visitor;

  if (!visitor) {
    throwError(Messages.VISITOR_REQUIRED);
  }

  const config = options.config;

  if (!config) {
    throwError(Messages.CONFIG_REQUIRED);
  }

  const client = config.client;

  if (!client) {
    throwError(Messages.CLIENT_REQUIRED);
  }

  const logger = options.logger;

  if (!logger) {
    throwError(Messages.LOGGER_REQUIRED);
  }

  const secure = config.secure === undefined ? true : Boolean(config.secure);
  const protocol = secure ? SECURE_PROTOCOL : PROTOCOL;
  const timeout = config.timeout || Number(TIMEOUT);
  const edgeCluster = options.targetLocationHintCookie;
  const cookies = parseCookies(options.targetCookie);

  this.execute = request => {
    if (!request) {
      return Promise.reject(new Error(Messages.REQUEST_REQUIRED));
    }

    if (!request.mbox) {
      return Promise.reject(new Error(Messages.MBOX_REQUIRED));
    }

    const sessionId = getSessionId(cookies);
    const deviceId = getDeviceId(cookies);
    const cluster = getCluster(deviceId, edgeCluster);
    console.log('Target Request', request);
    const targetRequest = createRequest(client, protocol, timeout, sessionId, deviceId, cluster, request, visitor);

    logger.log(AT_PREFIX, REQUEST_SENT, targetRequest);

    return executeRequest(http, targetRequest)
    .then(response => {
      logger.log(AT_PREFIX, RESPONSE_RECEIVED, response);

      return processResponse(cluster, response);
    });
  };
}

Target.getCookieName = () => TARGET_COOKIE;
Target.getLocationHintCookieName = () => LOCATION_HINT_COOKIE;

module.exports = Target;
