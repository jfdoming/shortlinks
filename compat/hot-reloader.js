import constants from "./constants-hr";

const createWebsocketConnection = (action) => {
  const ws = new WebSocket(`ws://localhost:${constants.port}`);
  ws.addEventListener("message", (event) => {
    if (event.data === "file-change") {
      action();
    }
  });
};

const listen = (request) => {
  if (request?.for === "hr" && request?.method === "file-change") {
    reload();
  }
};
const reload = () => {
  chrome.runtime.reload();
  chrome.runtime.onMessage.removeListener(listen);
};

export const reloadOnFileChange = () => {
  chrome.runtime.onMessage.addListener(listen);
  return createWebsocketConnection(reload);
};

export const notifyBackgroundOnFileChange = () =>
  createWebsocketConnection(() =>
    chrome.runtime.sendMessage({ for: "hr", method: "file-change" })
  );
