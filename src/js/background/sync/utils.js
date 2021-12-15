const promisify =
  (fn) =>
  (...args) =>
    new Promise((resolve, reject) =>
      fn(...args, (...results) =>
        chrome.runtime.lastError
          ? reject(Error(chrome.runtime.lastError.message))
          : resolve(...results)
      )
    );

export const getData = promisify(chrome.storage.sync.get);
export const setData = promisify(chrome.storage.sync.set);
