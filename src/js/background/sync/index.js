import { setData, getData } from "./utils";

const doSync = async () => {
  const syncedData = getData("");
};

chrome.alarms.create("chromeSyncAlarm", {
  periodInMinutes: 1,
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "chromeSyncAlarm") {
    doSync();
  }
});
