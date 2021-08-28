self.METHODS = {
  getRules: async () => {
    const rawRules = await chrome.declarativeNetRequest.getDynamicRules();
    const mappedRules = rawRules.map(
      ({
        action: { redirect },
        condition: { regexFilter, urlFilter },
        id,
      }) => ({ id, rewrite: redirect, condition: { regexFilter, urlFilter } })
    );
    return [mappedRules, null];
  },
};
