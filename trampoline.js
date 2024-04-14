const log = (...args) => {
  const [msg, ...rest] = args;
  console.log(`trampoline@iframe:${msg}`, ...rest);
};
// Goal for this script is to relay messages from the shared worker
// to the content script
//
// Triggers `onconnect` event in worker.js, making it aware of trampoline.js
var worker = new SharedWorker(chrome.runtime.getURL("worker.js"));
worker.port.start();
log("connected to worker");

// Establish communication with the parent window via content script
let contentscriptPort;
window.onmessage = function (event) {
  // Recv message from parent, which means:
  // "initialize iframe -> content script" communication port
  log("received message from content script, capturing port..", event.data);
  contentscriptPort = event.ports[0];
};

// Relay messages from the shared worker to the content script
worker.port.onmessage = function (event) {
  log("received message from worker", event.data);
  if (!contentscriptPort) {
    log("no content script port, skipping..");
    return;
  }

  log("relaying message to content script..", {
    event,
    date: new Date().toISOString(),
    ts: Date.now(),
  });
  contentscriptPort.postMessage(event.data);
};

log("listeners attached");
