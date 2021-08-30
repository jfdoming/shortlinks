let maxId = null;

const getRawRules = async () => {
  const rawRules = await chrome.declarativeNetRequest.getDynamicRules();
  if (maxId == null) {
    let workingMaxId = 0;
    rawRules.forEach(({ id }) => {
      if (id > workingMaxId) {
        workingMaxId = id;
      }
    });
    maxId = workingMaxId;
  }
  return rawRules;
};

const updateRules = (removeIds, addRules) => {
  return chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules,
  });
};

const getRules = async () => {
  const rawRules = await getRawRules();
  const mappedRules = rawRules.map(
    ({ action: { redirect }, condition: { regexFilter, urlFilter }, id }) => ({
      id,
      rewrite: redirect,
      condition: { regexFilter, urlFilter },
    })
  );
  return [mappedRules, null];
};

const makeRule = (id, { rewrite, match }) => {
  let condition;
  if (!match.query) {
    throw new Error("rule.match.query is required.");
  }
  switch (match.type) {
    case "PLAIN":
      const urlFilter = "||" + match.query.replace(/[^a-zA-Z0-9_-]/g, "") + "^";
      condition = { urlFilter };
      break;
    case "REGEX":
      const regexFilter = match.query;
      condition = { regexFilter };
      break;
    default:
      throw new Error('rule.match.type must be one of {"PLAIN", "REGEX"}.');
  }
  if (typeof rewrite === "string") {
    rewrite = { transform: { host: rewrite } };
  }

  return {
    id,
    action: { type: "redirect", redirect: rewrite },
    condition: { ...condition, resourceTypes: ["main_frame"] },
  };
};

const addRule = async (data) => {
  if (maxId == null) {
    await getRawRules();
  }

  // Incrementing this before the rule is actually added
  // might result in wasted IDs, but this is better than the alternative
  // of accidentally reusing the same ID.
  ++maxId;
  const id = maxId;
  const rule = makeRule(id, data);
  await updateRules([], [rule]);
  return [id, null];
};

const replaceRule = async (data) => {
  const { id } = data;
  const rule = makeRule(id, data);
  await updateRules([id], [rule]);
};

const deleteRule = async (id) => {
  await updateRules([id], []);
  if (id == maxId) {
    --maxId;
  }
};

self.METHODS = {
  getRules,
  addRule,
  replaceRule,
  deleteRule,
};
