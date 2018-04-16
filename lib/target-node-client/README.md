
# Marketing Cloud Client

Marketing Cloud Client allows clients to execute requests against Adobe edge network and retrieve personalized 
content that can be used to enhance user experience. Behind the scenes Marketing Cloud Client wraps two of the 
Adobe Marketing Cloud solutions, MCID (Marketing Cloud Identity Service) also known as Visitor API and Adobe Target also known as TNT.

## Super simple to use

Marketing Cloud Client has been designed to be the simplest way to interact with Adobe Target delivery API.

```js
const MarketingCloudClient = require("@adobe/target-node-client");

const marketingCloudClient = MarketingCloudClient.create({
  config: {
    client: "acmeclient",
    organizationId: "1234567890@AdobeOrg",
    timeout: 5000
  }
});

marketingCloudClient.getOffer({
  payload: {
    mbox : "some-mbox"
  }
})
.then(offer => console.log('Offer', offer))
.catch(error => console.error('Error', error));
```

## Table of contents

- [Target Only](#target-only)
- [MCID integration](#mcid-integration)
- [MCID with customer IDs integration](#mcid-with-customer-ids-integration)
- [MCID and Analytics integration](#mcid-and-analytics-integration)
- [MCID and Analytics and at.js integration](#mcid-and-analytics-and-at.js-integration)
- [Troubleshooting](#troubleshooting)
- [Marketing Cloud Client API](#marketing-cloud-client-api)


---


## Target Only

Marketing Cloud Client can be used to retrieve personalized content from TNT without being forced to use MCID. 

```js
const MarketingCloudClient = require("@adobe/target-node-client");

const marketingCloudClient = MarketingCloudClient.create({
  config: {
    client: "acmeclient",
    organizationId: "1234567890@AdobeOrg",
  }
});

marketingCloudClient.getOffer({
  payload: {
    mbox : "server-side-mbox"
  }
})
.then(offer => console.log('Offer', offer))
.catch(error => console.error('Error', error));
```

By default Marketing Cloud Client would generate a new session ID for every TNT call which might not always be the desired behavior. To make sure
that TNT properly tracks user session we should make sure TNT cookie is sent to the browser when TNT content is retrieved and TNT cookie value
is passed to `getOffer()` when a request is processed. In an `Express` application we could have something like this:

```js
const express = require("express");
const cookieParser = require("cookie-parser");
const MarketingCloudClient = require("@adobe/target-node-client");
const CONFIG = {
  client: "acmeclient",
  organizationId: "1234567890@AdobeOrg"
};

const marketingCloudClient = MarketingCloudClient.create({config: CONFIG});
const app = express();

app.use(cookieParser());

function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name, cookie.value, {maxAge: cookie.maxAge * 1000});
}

function sendSuccessResponse(res, offer) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });

  saveCookie(res, offer.targetCookie);

  res.status(200).send(offer);
}

function sendErrorResponse(res, error) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });

  res.status(500).send(error);
}

app.get("/abtest", function (req, res) {
  const targetCookieName = encodeURIComponent(MarketingCloudClient.getTargetCookieName());
  const targetCookie = req.cookies[targetCookieName];
  const payload = {"mbox" : "server-side-mbox"};
  const request = Object.assign({payload}, {targetCookie});

  console.log("Request", request);

  marketingCloudClient.getOffer(request)
  .then(offer => {
    sendSuccessResponse(res, offer);
  })
  .catch(error => {
    sendErrorResponse(res, error);
  });
});

app.listen(3000, function () {
  console.log("Listening on port 3000 and watching!");
});
```

Full sample: https://github.com/Adobe-Marketing-Cloud/target-node-client-samples/tree/master/target-only

---


## MCID integration

While using Marketing Cloud Client for fetching content from TNT can be pretty powerful, the added value of using MCID for user tracking would
outweigh using TNT only. MCID allows leveraging all the goodies found in Adobe Experience Cloud like audience sharing, analytics etc. Using TNT and
MCID in an `Express` application is pretty straightforward. MCID has a client side part to it, so we'll have to use a simple template that references
MCID JavaScript library. Here is the `Express` application:

```js
const express = require("express");
const cookieParser = require("cookie-parser");
const MarketingCloudClient = require("@adobe/target-node-client");
const CONFIG = {
  client: "acmeclient",
  organizationId: "1234567890@AdobeOrg"
};
const TEMPLATE = `
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Marketing Cloud Client NodeJS SDK Sample</title>
  <script src="VisitorAPI.js"></script>
  <script>
    Visitor.getInstance("${organizationId}", {serverState: ${visitorState}});
  </script>
</head>
<body>
  <p>${content}</p>
</body>
</html>
`;
const marketingCloudClient = MarketingCloudClient.create({config: CONFIG});
const app = express();

app.use(cookieParser());
// We assume that VisitorAPI.js is stored in "public" folder
app.use(express.static(__dirname + "/public"));

function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name, cookie.value, {maxAge: cookie.maxAge * 1000});
}

function sendSuccessResponse(res, offer) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });

  const result = TEMPLATE
  .replace("${organizationId}", CONFIG.organizationId)
  .replace("${visitorState}", JSON.stringify(offer.visitorState))
  .replace("${content}", offer.content);

  saveCookie(res, offer.targetCookie);

  res.status(200).send(result);
}

function sendErrorResponse(res, error) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });

  res.status(500).send(error);
}

app.get("/abtest", function (req, res) {
  const visitorCookieName = encodeURIComponent(MarketingCloudClient.getVisitorCookieName(CONFIG.organizationId));
  const visitorCookie = req.cookies[visitorCookieName];
  const targetCookieName = encodeURIComponent(MarketingCloudClient.getTargetCookieName());
  const targetCookie = req.cookies[targetCookieName];
  const payload = {"mbox" : "server-side-mbox"};
  const request = Object.assign({payload}, {targetCookie}, {visitorCookie});

  console.log("Request", request);

  marketingCloudClient.getOffer(request)
  .then(offer => {
    sendSuccessResponse(res, offer);
  })
  .catch(error => {
    sendErrorResponse(res, error);
  });
});

app.listen(3000, function () {
  console.log("Listening on port 3000 and watching!");
});
```

The biggest benefit of using MCID integration is that it allows you to share Audience Manager segments with Target. It should be noted that since
this is a server side integration for first time visitors we might not have any Audience Manager related data.

Full sample: https://github.com/Adobe-Marketing-Cloud/target-node-client-samples/tree/master/mcid-integration

---

## MCID with customer IDs integration

Sometimes when you have logged in details, you could be more specific and pass the logged details via `customerIds`. The `customerIds` object is similar to the MCID functionality described here: https://marketing.adobe.com/resources/help/en_US/mcvid/mcvid-authenticated-state.html.

Here is the `Express` application that shows `customerIds` in action:

```js
const express = require("express");
const cookieParser = require("cookie-parser");
const MarketingCloudClient = require("@adobe/target-node-client");
const CONFIG = {
  client: "acmeclient",
  organizationId: "1234567890@AdobeOrg"
};
const TEMPLATE = `
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Marketing Cloud Client NodeJS SDK Sample</title>
  <script src="VisitorAPI.js"></script>
  <script>
    Visitor.getInstance("${organizationId}", {serverState: ${visitorState}});
  </script>
</head>
<body>
  <p>${content}</p>
</body>
</html>
`;
const marketingCloudClient = MarketingCloudClient.create({config: CONFIG});
const app = express();

app.use(cookieParser());
// We assume that VisitorAPI.js is stored in "public" folder
app.use(express.static(__dirname + "/public"));

function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name, cookie.value, {maxAge: cookie.maxAge * 1000});
}

function sendSuccessResponse(res, offer) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });

  const result = TEMPLATE
  .replace("${organizationId}", CONFIG.organizationId)
  .replace("${visitorState}", JSON.stringify(offer.visitorState))
  .replace("${content}", offer.content);

  saveCookie(res, offer.targetCookie);

  res.status(200).send(result);
}

function sendErrorResponse(res, error) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });

  res.status(500).send(error);
}

app.get("/abtest", function (req, res) {
  const visitorCookieName = encodeURIComponent(MarketingCloudClient.getVisitorCookieName(CONFIG.organizationId));
  const visitorCookie = req.cookies[visitorCookieName];
  const targetCookieName = encodeURIComponent(MarketingCloudClient.getTargetCookieName());
  const targetCookie = req.cookies[targetCookieName];
  const customerIds = {
    "userid": {
      "id": "67312378756723456",
      "authState": MarketingCloudClient.AuthState.AUTHENTICATED
    }
  };
  const payload = {
    "mbox" : 
    "server-side-mbox"
  };
  const request = Object.assign({customerIds}, {payload}, {targetCookie}, {visitorCookie});

  console.log("Request", request);

  marketingCloudClient.getOffer(request)
  .then(offer => {
    sendSuccessResponse(res, offer);
  })
  .catch(error => {
    sendErrorResponse(res, error);
  });
});

app.listen(3000, function () {
  console.log("Listening on port 3000 and watching!");
});
```

Full sample: https://github.com/Adobe-Marketing-Cloud/target-node-client-samples/tree/master/mcid-customer-ids-integration

---


## MCID and Analytics integration

To get the most of Marketing Cloud Client and use the powerful analytics capabilities provided by Adobe Analytics you can use the MCID, Analytics and
TNT combo. Here is a simple `Express` application that demonstrates how you can use all three solutions in a single application. 

```js
const express = require("express");
const cookieParser = require("cookie-parser");
const MarketingCloudClient = require("@adobe/target-node-client");
const CONFIG = {
  client: "acmeclient",
  organizationId: "1234567890@AdobeOrg"
};
const TEMPLATE = `
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Marketing Cloud Client NodeJS SDK Sample</title>
  <script src="VisitorAPI.js"></script>
  <script>
    Visitor.getInstance("${organizationId}", {serverState: ${visitorState}});
  </script>
</head>
<body>
  <p>${content}</p>
  <script src="AppMeasurement.js"></script>
  <script>var s_code=s.t();if(s_code)document.write(s_code);</script>
</body>
</html>
`;
const marketingCloudClient = MarketingCloudClient.create({config: CONFIG});
const app = express();

app.use(cookieParser());
// We assume that VisitorAPI.js and AppMeasurement.js is stored in "public" folder
app.use(express.static(__dirname + "/public"));

function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name, cookie.value, {maxAge: cookie.maxAge * 1000});
}

function sendSuccessResponse(res, offer) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });

  const result = TEMPLATE
  .replace("${organizationId}", CONFIG.organizationId)
  .replace("${visitorState}", JSON.stringify(offer.visitorState))
  .replace("${content}", offer.content);

  saveCookie(res, offer.targetCookie);

  res.status(200).send(result);
}

function sendErrorResponse(res, error) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });

  res.status(500).send(error);
}

app.get("/abtest", function (req, res) {
  const visitorCookieName = encodeURIComponent(MarketingCloudClient.getVisitorCookieName(CONFIG.organizationId));
  const visitorCookie = req.cookies[visitorCookieName];
  const targetCookieName = encodeURIComponent(MarketingCloudClient.getTargetCookieName());
  const targetCookie = req.cookies[targetCookieName];
  const payload = {"mbox" : "server-side-mbox"};
  const request = Object.assign({payload}, {targetCookie}, {visitorCookie});

  console.log("Request", request);

  marketingCloudClient.getOffer(request)
  .then(offer => {
    sendSuccessResponse(res, offer);
  })
  .catch(error => {
    sendErrorResponse(res, error);
  });
});

app.listen(3000, function () {
  console.log("Listening on port 3000 and watching!");
});
```

Using MCID, Analytics and TNT allows you:
- use segments from Audience Manager
- customize user experience based on the content retrieved from TNT and
- ensure that all the events and success metrics are collected in Analytics
- use Analytics powerful queries and benefit from awesome visualizations

Full sample: https://github.com/Adobe-Marketing-Cloud/target-node-client-samples/tree/master/mcid-analytics-integration

---


## MCID and Analytics and at.js integration

Most of the time Marketing Cloud Client will be used in a NodeJS application like `Express`, `Hapi`, `Koa` etc. However with recent proliferation of 
frameworks that allow server side rendering like Facebook React or Angular 4.x. There are use cases where server side should be aware and work in
tandem with client side libraries. In TNT case the client side library is `at.js`.

The integration between server side and client side is also known as "hybrid" testing mode. The biggest challenge when trying to integrate server side and client side is to ensure that both server side and client side TNT calls are hitting the same TNT edge cluster. Otherwise we may end
up with different user profiles being created by server side and client side calls.

To mitigate this TNT uses the so called location hint cookie. To be able to use location hint cookie you'll have to add the following JavaScript to your HTML page before `at.js` or make sure that this code is executed before `at.js`, in case you are using a tag manager like `Adobe DTM`.

```js
window.targetGlobalSettings = {
  overrideMboxEdgeServer: true
};
```

To see the TNT location hint cookie and `at.js` integration in action here is a simple `Express` application:

```js
const express = require("express");
const cookieParser = require("cookie-parser");
const MarketingCloudClient = require("@adobe/target-node-client");
const CONFIG = {
  client: "acmeclient",
  organizationId: "1234567890@AdobeOrg"
};
const TEMPLATE = `
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Marketing Cloud Client NodeJS SDK Sample</title>
  <script src="VisitorAPI.js"></script>
  <script>
    Visitor.getInstance("${organizationId}", {serverState: ${visitorState}});
  </script>
  <script>
    window.targetGlobalSettings = {
      overrideMboxEdgeServer: true
    };
  </script>
  <script src="at.js"></script>
</head>
<body>
  <p>${content}</p>
  <script src="AppMeasurement.js"></script>
  <script>var s_code=s.t();if(s_code)document.write(s_code);</script>
</body>
</html>
`;
const marketingCloudClient = MarketingCloudClient.create({config: CONFIG});
const app = express();

app.use(cookieParser());
// We assume that VisitorAPI.js, at.js and AppMeasurement.js is stored in "public" folder
app.use(express.static(__dirname + "/public"));

function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name, cookie.value, {maxAge: cookie.maxAge * 1000});
}

function sendSuccessResponse(res, offer) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });

  const result = TEMPLATE
  .replace("${organizationId}", CONFIG.organizationId)
  .replace("${visitorState}", JSON.stringify(offer.visitorState))
  .replace("${content}", offer.content);

  saveCookie(res, offer.targetCookie);
  saveCookie(res, offer.targetLocationHintCookie);

  res.status(200).send(result);
}

function sendErrorResponse(res, error) {
  res.set({
    "Content-Type": "text/html",
    "Expires": new Date().toUTCString()
  });

  res.status(500).send(error);
}

app.get("/abtest", function (req, res) {
  const visitorCookieName = encodeURIComponent(MarketingCloudClient.getVisitorCookieName(CONFIG.organizationId));
  const visitorCookie = req.cookies[visitorCookieName];
  const targetCookieName = encodeURIComponent(MarketingCloudClient.getTargetCookieName());
  const targetCookie = req.cookies[targetCookieName];
  const targetLocationHintCookieName = encodeURIComponent(MarketingCloudClient.getTargetLocationHintCookieName());
  const targetLocationHintCookie = req.cookies[targetLocationHintCookieName];
  const payload = {"mbox" : "server-side-mbox"};
  const request = Object.assign({payload}, {targetCookie}, {visitorCookie}, {targetLocationHintCookie});

  console.log("Request", request);

  marketingCloudClient.getOffer(request)
  .then(offer => {
    sendSuccessResponse(res, offer);
  })
  .catch(error => {
    sendErrorResponse(res, error);
  });
});

app.listen(3000, function () {
  console.log("Listening on port 3000 and watching!");
});
```

Using `at.js` integration allows use cases where a TNT experience is started on the server side and is continued on the client side by `at.js` AKA "hybrid" testing. The downside of this approach is that we might see some performance degradations when NodeJS application that uses Marketing Cloud Client is not GEO distributed as TNT edge clusters.

Full sample: https://github.com/Adobe-Marketing-Cloud/target-node-client-samples/tree/master/mcid-analytics-atjs-integration

---


## Troubleshooting

Marketing Cloud Client is a glorified HTTP/HTTPS client, so to understand what is happening on the wire you can provide a `logger` object. The `logger` objects is expected to have a `log()` method that receives a list of parameters. The default `logger` has a noop `log()` implementation. To be able to inspect HTTP request and response you can provide a custom `logger`. Here is an example that shows a `logger` that logs everything to `console`:

```js
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const MarketingCloudClient = require("../lib/index");

const CONFIG = {
  client: "acmeclient",
  organizationId: "1234567890@AdobeOrg",
};

const logger = getLogger();
const marketingCloudClient = createMarketingCloudClient(logger, CONFIG);

function getLogger() {
  return {
    log: function(...arr) {
      console.log(...arr);
    }
  };
}

function createMarketingCloudClient(logger, config) {
  const options = Object.assign({logger}, {config});

  return MarketingCloudClient.create(options);
}

marketingCloudClient.getOffer({
  payload: {
    mbox : "some-mbox"
  }
})
.then(offer => console.log('Offer', offer))
.catch(error => console.error('Error', error));
```

In case you want to use a more robust `logger` you can always create a logger that delegates to `winston`, `bunyan` or any other well known NodeJS logging library.


---


## Marketing Cloud Client API 

`MarketingCloudClient.create(options: Object): MarketingCloudClient` - creates an instance of Marketing Cloud Client. 
 
The `options` object has the following structure:
 
| Name                    | Type   |Required | Default | Description       |
|-------------------------|--------|---------|---------|-------------------|
| config                  | Object | Yes     | None    | General config    |
| logger                  | Object | No      | NOOP    | Logger to be used | 

The `config` object should have the following structure:

| Name            | Type     |Required | Default | Description                            |
|-----------------|----------|---------|---------|----------------------------------------|
| client          |  String  | Yes     | None    | Target client                          |
| organizationId  |  String  | Yes     | None    | Organization ID                        |
| timeout         |  Number  | No      | None    | Target request timeout in milliseconds |
| secure          |  Boolean | No      | true    | Target request over HTTP or HTTPS      |

`MarketingCloudClient.getVisitorCookieName(organizationId: string): string` - used to retrieve MCID cookie name.
 
`MarketingCloudClient.getTargetCookieName(): string` - used to retrieve Target cookie name.

`MarketingCloudClient.getTargetLocationHintCookieName(): string` - used to retrieve Target location hint cookie name.

`MarketingCloudClient.getOffer(request: Object): Promise` - fetches an offer from TNT.

The `request` object has the following structure:

| Name                     | Type     | Required  | Default | Description                      |
|--------------------------|----------|-----------|---------|----------------------------------|
| payload                  | Object   |  Yes      | None    | Server Side Delivery API payload |
| targetCookie             | String   |  No       | None    | Target cookie                    |
| targetLocationHintCookie | String   |  No       | None    | Target location hint cookie      |
| visitorCookie            | String   |  No       | None    | Visitor cookie                   |

To learn more about TNT Server Side Delivery API please visit: http://developers.adobetarget.com/api/#server-side-delivery

The `promise` returned by `MarketingCloudClient.getOffer(...)` wraps an `offer`. The `offer` object has the following structure:

| Name                     | Type              | Description                                                 |
|--------------------------|-------------------|-------------------------------------------------------------|
| targetCookie             | Object            | Target cookie                                               |
| targetLocationHintCookie | Object            | Target location hint cookie                                 |
| visitorState             | Object            | Object that should be passed to Visitor API `getInstance()` |
| content                  | String or Object  | Personalized content, can be string or object               |

The `cookie` object used for passing data back to the browser has the following structure:

| Name   | Type   | Description                                                                                               |
|--------|--------|-----------------------------------------------------------------------------------------------------------|
| name   | String | Cookie name                                                                                               |
| value  | Any    | Cookie value, the value will converted to string                                                          |
| maxAge | Number | The `maxAge` option is a convenience option for setting `expires` relative to the current time in seconds |


[back to top](#table-of-contents)
