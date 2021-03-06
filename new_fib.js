// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

var xmlhttprequest = require("xmlhttprequest");
var ws = require("ws");
var fs = require("fs");
global.XMLHttpRequest = xmlhttprequest.XMLHttpRequest;
global.WebSocket = ws;
var jupyter = require("@jupyterlab/services");

var gatewayUrl = process.env.BASE_GATEWAY_HTTP_URL || "http://localhost:8888";
var gatewayWsUrl = process.env.BASE_GATEWAY_WS_URL || "ws://localhost:8888";

var demoLang = process.env.DEMO_LANG || "python3";
var demoInfo = {
  python3: {
    kernelName: "python3",
    filename: "test_fib.py",
  },
}[demoLang];
var demoSrc = fs.readFileSync(demoInfo.filename, { encoding: "utf-8" });

console.log("Targeting server:", gatewayUrl);
console.log("Using example code:", demoInfo.filename);

var ajaxSettings = {};

// For authentication, set the environment variables:
// BASE_GATEWAY_USERNAME and BASE_GATEWAY_PASSWORD.

if (process.env.BASE_GATEWAY_USERNAME) {
  ajaxSettings["user"] = process.env.BASE_GATEWAY_USERNAME;
}

if (process.env.BASE_GATEWAY_PASSWORD) {
  ajaxSettings["password"] = process.env.BASE_GATEWAY_PASSWORD;
}

console.log("ajaxSettings: ", ajaxSettings);

const settings = jupyter.ServerConnection.makeSettings({
  baseUrl: gatewayUrl,
  wsUrl: gatewayWsUrl,
});

const kernelManager = new jupyter.KernelManager({
  serverSettings: settings,
});

(async () => {
  const kernel = await kernelManager.startNew({ name: "python3" });

  kernel.statusChanged.connect((_, status) => console.log(status));

  const future = kernel.requestExecute({ code: demoSrc });

  future.onIOPub = (msg) =>
    msg.header.msg_type !== "status" && console.log(msg);

  await future.done;
})();
