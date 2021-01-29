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

var demoLang = process.env.DEMO_LANG || "python";
var demoInfo = {
  python: {
    kernelName: "python",
    filename: "test_matplotlib.py",
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

// get info about the available kernels
jupyter.KernelSpecAPI.getSpecs(settings)
  .then((kernelSpecs) => {
    console.log("Available kernelspecs:", kernelSpecs);

    // request a new kernel
    console.log("Starting kernel:", demoLang);
    kernelManager
      .startNew({
        name: demoInfo.kernelName,
      })
      .then((kernel) => {
        // execute some code
        console.log("Executing sample code");

        const future = kernel.requestExecute(
          {
            code: demoSrc,
          },
          false
        );

        future.done.then(() => {
          process.exit(0);
        });

        future.onIOPub = (msg) => {
          console.log("Received message", msg);
        };
      })
      .catch((req) => {
        console.log("Error starting new kernel:", req);
        process.exit(1);
      });
  })
  .catch((req) => {
    console.log("Error fetching kernel specs:", req);
    process.exit(1);
  });
