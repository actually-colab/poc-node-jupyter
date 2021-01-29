// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

var xmlhttprequest = require("xmlhttprequest");
var ws = require("ws");
var fs = require("fs");
global.XMLHttpRequest = xmlhttprequest.XMLHttpRequest;
global.WebSocket = ws;
var jupyter = require("jupyter-js-services");

var gatewayUrl = process.env.BASE_GATEWAY_HTTP_URL || "http://localhost:8888";
var gatewayWsUrl = process.env.BASE_GATEWAY_WS_URL || "ws://localhost:8888";

var demoLang = process.env.DEMO_LANG || "python";
var demoInfo = {
  python: {
    kernelName: "python",
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

// get info about the available kernels
jupyter.Kernel.getSpecs({
  baseUrl: gatewayUrl,
  ajaxSettings: ajaxSettings,
})
  .then((kernelSpecs) => {
    console.log("Available kernelspecs:", kernelSpecs);

    // request a new kernel
    console.log("Starting kernel:", demoLang);
    jupyter.Kernel.startNew({
      baseUrl: gatewayUrl,
      wsUrl: gatewayWsUrl, // passing this separately to demonstrate basic auth
      name: demoInfo.kernelName,
      ajaxSettings: ajaxSettings,
    })
      .then((kernel) => {
        // execute some code
        console.log("Executing sample code");
        var future = kernel.execute({ code: demoSrc });
        future.onDone = () => {
          // quit the demo when done, but leave the kernel around
          var future2 = kernel.execute({
            code: "def fib1(n):\n    return fib(n + 1)\nprint(fib1(4))",
          });
          future2.onDone = () => {
            process.exit(0);
          };
          future2.onIOPub = (msg) => {
            console.log("Received message", msg);
          };
        };
        future.onIOPub = (msg) => {
          // print received messages
          console.log("Received message:", msg);
        };
      })
      .catch((req) => {
        console.log("Error starting new kernel:", req.xhr.statusText);
        process.exit(1);
      });
  })
  .catch((req) => {
    console.log("Error fetching kernel specs:", req.xhr.statusText);
    process.exit(1);
  });
