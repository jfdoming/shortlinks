const rpc = (method, data) => {
  let resolve, reject;
  const result = new Promise((...methods) => {
    [resolve, reject] = methods;
  });
  chrome.runtime.sendMessage(
    { for: "background", method, data },
    (response) => {
      if (response?.code == 200) {
        resolve(response.data);
      } else {
        reject(response);
      }
    }
  );
  return result;
};
const genRpc =
  (name, passData = true) =>
  (data) =>
    rpc(name, passData ? data : undefined);

// getRules()
export const getRules = genRpc("getRules", false);

// addRule({ rewrite, match })
export const addRule = genRpc("addRule");

// replaceRule({ id, rewrite, match })
export const replaceRule = genRpc("replaceRule");

// deleteRule(id)
export const deleteRule = genRpc("deleteRule");

window.getRules = getRules;
window.addRule = addRule;
window.replaceRule = replaceRule;
window.deleteRule = deleteRule;
