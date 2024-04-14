const log = (...args) => {
  const [msg, ...rest] = args;
  console.log(`webworker:${msg}`, ...rest);
};

var ports = [];
console.log("worker initialized");

onconnect = function (event) {
  log("received client connection", { event });
  var port = event.ports[0];
  ports.push(port);
  port.start();

  port.onmessage = function (event) {
    const validPorts = ports.filter((p) => p != port);
    for (var i = 0; i < validPorts.length; ++i) {
      const port = validPorts[i];
      log(`relaying message to client (${i + 1}/${validPorts.length})`, {
        event,
        port,
      });

      port.postMessage(event.data);
    }
  };
};
