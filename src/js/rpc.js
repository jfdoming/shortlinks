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

export const getRules = () => {
  return rpc("getRules");
};
