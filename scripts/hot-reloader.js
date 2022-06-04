const chokidar = require("chokidar"),
  WebSocket = require("ws"),
  debounce = require("lodash.debounce"),
  path = require("path");

const createState = () => {
  let ws = { current: null };
  let shouldReload = false;
  const doSend = debounce(() => {
    if (ws.current != null) {
      console.log(`file change detected, reloading...`);
      ws.current.send("file-change");
      shouldReload = false;
    } else {
      shouldReload = true;
    }
  }, 500);

  return [
    (catchUp = false) => {
      if (!catchUp || shouldReload) {
        doSend();
      }
    },
    ws,
  ];
};

module.exports = ({ port, directory, exclude = [] }) => {
  const directoryPath = path.resolve(directory);
  const excludePaths = exclude.map((file) => path.join(directoryPath, file));

  const [send, ws] = createState();

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
    ws.current = paramWs;

    ws.current.on("close", (code) => {
      ws.current = null;
      console.log(
        `extension connection terminated${code == 1001 ? " (lost focus)" : ""}.`
      );
    });
    ws.current.onerror = console.error;

    console.log("extension connection established.");

    send(true);
  });
};
