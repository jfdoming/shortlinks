import constants from "./constants-hr";

const createWebsocketConnection = (action) => {
  const ws = new WebSocket(`ws://localhost:${constants.port}`);
  ws.addEventListener("message", (event) => {
    console.log("recv message:", event.data);
    action(event.data);
  });
};

const listen = (request) => {
  if (request?.for === "hr" && request?.method === "file-change") {
    reload();
  }
};
const reload = (type) => {
  if (type === "file-change") {
    chrome.runtime.reload();
    chrome.runtime.onMessage.removeListener(listen);
  } else {
    chrome.runtime.openOptionsPage();
  }
};

export const reloadOnFileChange = () => {
  chrome.runtime.onMessage.addListener(listen);
  return createWebsocketConnection(reload);
};

export const notifyBackgroundOnFileChange = () =>
  createWebsocketConnection(
    (type) =>
      console.log("<- local") ||
      (type === "file-change" &&
        chrome.runtime.sendMessage({ for: "hr", method: "file-change" }))
  );
