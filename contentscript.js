const log = (...args) => {
  const [msg, ...rest] = args;
  console.log(`content-script:${msg}`, ...rest);
};

function initframe() {
  // loads the trampoline script into the iframe
  // this script will relay any
  let frame = document.getElementById("trampoline");
  if (frame) {
    log("trampoline already exists, skipping..");
    return frame;
  }
  if (!document.body) {
    log("document.body not ready, skipping..");
    return;
  }

  frame = document.createElement("iframe");
  frame.id = "trampoline";
  frame.hidden = true;
  frame.src = chrome.runtime.getURL("trampoline.html");
  document.documentElement.appendChild(frame);
  log("initialized trampoline iframe");
  return frame;
}

const frame = initframe();
frame.addEventListener("load", () => {
  channel = new MessageChannel();

  // port1 is the one that creates the message channel
  channel.port1.onmessage = function (event) {
    log("received message from trampoline!", {
      event,
      date: new Date().toISOString(),
      ts: Date.now(),
    });

    // visual representation: renders the message as text in the document
    const element = document.createElement("ul");
    document.body?.prepend(element);
    readStream(new Blob([event.data]).stream(), element);
  };

  // port2 is the one that sends the message channel for the
  // other end
  frame.contentWindow.postMessage(frame.src, "*", [channel.port2]);
  log("sent init message to trampoline iframe");
});

function readStream(stream, element) {
  const reader = stream.getReader();
  let charsReceived = 0;

  let start = Date.now();

  reader.read().then(function processText({ done, value }) {
    if (done) {
      let listItem = document.createElement("li");
      listItem.textContent = `Reading done! Total bytes read: ${charsReceived / (1024 * 1024)}MB`;
      element.appendChild(listItem);
      return;
    }

    charsReceived += value.length;
    const chunk = value;
    let listItem = document.createElement("li");
    listItem.textContent = `Chunk received: ${chunk.length / 1024}kb, accumulated:${charsReceived / (1024 * 1024)}MB. Elapsed: ${Date.now() - start}ms`;
    element.appendChild(listItem);
    return reader.read().then(processText);
  });
}
