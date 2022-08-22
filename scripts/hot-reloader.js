const chokidar = require("chokidar"),
  WebSocket = require("ws"),
  debounce = require("lodash.debounce"),
  path = require("path");

const createState = () => {
  let state = { ws: null, optionsOpen: true };
  let shouldReload = false;
  const doSend = debounce(() => {
    if (state.ws != null) {
      console.log(`file change detected, reloading...`);
      state.ws.send("file-change");
      shouldReload = false;
    } else {
      shouldReload = true;
    }
  }, 500);

  return [
    (catchUp = false) => {
      if (!catchUp || shouldReload) {
        doSend();
      } else if (catchUp && state.optionsOpen) {
        state.ws.send("open-options");
      }
    },
    state,
  ];
};

module.exports = ({ port, directory, exclude = [] }) => {
  const directoryPath = path.resolve(directory);
  const excludePaths = exclude.map((file) => path.join(directoryPath, file));

  const [send, state] = createState();

  const watcher = chokidar.watch(directoryPath, {
    ignoreInitial: true,
  });
  watcher.on("all", (_, path) => {
    if (!excludePaths.includes(path)) {
      send();
    }
  });

  const wss = new WebSocket.Server({ port });

  wss.on("listening", () => {
    console.log("hot reload server is listening...");
  });

  wss.on("close", () => {
    console.log("hot reload server closed.");
  });

  wss.on("connection", (paramWs) => {
    const firstWs = state.ws == null;
    console.log(firstWs);

    state.ws = paramWs;

    state.ws.on("close", (code) => {
      state.ws = null;
      console.log(
        `extension connection terminated${code == 1001 ? " (lost focus)" : ""}.`
      );
    });
    state.ws.onerror = console.error;

    console.log("extension connection established.");

    if (firstWs) send(true);
  });
};
