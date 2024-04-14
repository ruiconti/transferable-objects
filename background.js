const log = (...args) => {
  const [msg, ...rest] = args;
  console.log(`background:${msg}`, ...rest);
};

var worker = new SharedWorker(chrome.runtime.getURL("worker.js"));
worker.port.start();
log("connected to worker");

window.send = () => {
  const buf = new ArrayBuffer(1 * 1024 * 1024 * 1024 /* 1G buffer */);
  let uint8View = new Uint8Array(buf);
  for (let i = 0; i < uint8View.length; i++) {
    uint8View[i] = i % 255; // dirt
  }
  log("created 1G buffer", { len: buf.byteLength });

  worker.port.postMessage(buf, [buf]);
  log("sent buffer to worker", {
    date: new Date().toISOString(),
    ts: Date.now(),
  });
};
