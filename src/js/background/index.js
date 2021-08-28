let mappings = {
  c: "calendar.google.com",
  m: "mail.google.com",
  d: "drive.google.com",
  drive: "drive.google.com",
};

let rules = Object.entries(mappings).reduce(
  (rror, [k, v], index) => [
    ...rror,
    {
      id: index + 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { transform: { host: v } },
      },
      condition: {
        urlFilter: `||${k}^`,
        resourceTypes: ["main_frame"],
      },
    },
  ],
  []
);

chrome.declarativeNetRequest
  .updateDynamicRules({
    removeRuleIds: [1, 2, 3, 4],
    addRules: rules,
  })
  .then((...args) => console.log("success", ...args))
  .catch((...args) => console.log("error", ...args));

importScripts("background-methods.bundle.js");

const handleRequest = async (request) => {
  if (request?.for == "background" && self.METHODS?.[request.method]) {
    console.log(`Received request for method ${request.method}, processing...`);
    try {
      [response, error] = await self.METHODS[request.method](request.data);
      return {
        code: error ? 500 : 200,
        message: error ? "Internal Server Error" : "OK",
        data: error || response,
      };
    } catch (e) {
      return { code: 500, message: "Internal Server Error", data: e };
    }
  }
  return { code: 404, message: "Not Found", data: null };
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleRequest(request).then(sendResponse);
  return true;
});
