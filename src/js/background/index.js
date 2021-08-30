importScripts("background-methods.bundle.js");

const handleRequest = async (request) => {
  if (request?.for == "background" && self.METHODS?.[request.method]) {
    console.log(`Received request for method ${request.method}, processing...`);
    try {
      const result = await self.METHODS[request.method](request.data);
      const [response, error] = result || [];

      return {
        code: error ? 500 : 200,
        message: error ? "Internal Server Error" : "OK",
        data: error || response,
      };
    } catch (e) {
      return {
        code: 500,
        message: "Internal Server Error",
        data: e.toString(),
      };
    }
  }
  return { code: 404, message: "Not Found", data: null };
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleRequest(request).then(sendResponse);
  return true;
});
