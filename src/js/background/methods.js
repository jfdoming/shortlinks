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

const AUTO_REGEXP_START = "^((?:[^/]+://)?(?:[a-zA-Z0-9-]*.)?)";
const AUTO_REGEXP_END = "(/.*|$)";

const getRewriteFromRedirect = (redirect, match) => {
  if (redirect.regexSubstitution) {
    if (
      redirect.regexSubstitution.startsWith("\\1") &&
      redirect.regexSubstitution.endsWith("\\2") &&
      match.startsWith(AUTO_REGEXP_START) &&
      match.endsWith(AUTO_REGEXP_END)
    ) {
      try {
        redirect = makeRedirect(redirect.regexSubstitution.slice(2, -2));
        return getRewriteFromRedirect(redirect, match);
      } catch {
        // Fall through.
      }
    }
    return redirect.regexSubstitution;
  }
  if (redirect.url) {
    return { target: redirect.url, exact: true };
  }
  const { transform } = redirect;
  const {
    fragment = "",
    host = "",
    password = "",
    path = "",
    port = "",
    query = "",
    scheme = "",
    username = "",
  } = transform;
  const credentials = username + (password ? ":" + password : "");
  const credentialsFmt = credentials ? credentials + "@" : "";
  const protocol = scheme ? scheme + "://" : "";
  const portFmt = port ? ":" + port : "";
  return protocol + credentialsFmt + host + portFmt + path + query + fragment;
};

const getMatchFromFilter = (filter, wasRegex) => {
  if (wasRegex) {
    if (
      filter.startsWith(AUTO_REGEXP_START) &&
      filter.endsWith(AUTO_REGEXP_END)
    ) {
      return filter.slice(AUTO_REGEXP_START.length, -AUTO_REGEXP_END.length);
    }
    return { query: filter, regex: true };
  }
  return filter;
};

const getRules = async () => {
  const rawRules = await getRawRules();
  const mappedRules = rawRules.map(
    ({ action: { redirect }, condition: { regexFilter, urlFilter }, id }) => {
      const filter = regexFilter || urlFilter.slice(2, -1);
      const rewrite = getRewriteFromRedirect(redirect, filter);
      const match = getMatchFromFilter(filter, !!regexFilter);
      return { id, rewrite, match };
    }
  );
  return [mappedRules, null];
};

const makeRedirect = (urlString) => {
  let usingHost = true;
  if (urlString.startsWith("/")) {
    urlString = "somehost" + urlString;
    usingHost = false;
  }
  let usingProtocol = true;
  if (!urlString.includes("://")) {
    urlString = "http://" + urlString;
    usingProtocol = false;
  }

  const url = new URL(urlString);
  const fragment = url.hash || undefined;
  const host = usingHost ? url.hostname : undefined;
  const password = url.password || undefined;
  const path = url.pathname && url.pathname != "/" ? url.pathname : undefined;
  const port = url.port || undefined;
  const query = url.search || undefined;
  const scheme = usingProtocol ? url.protocol.slice(0, -1) : undefined;
  const username = url.username || undefined;

  return {
    transform: {
      fragment,
      host,
      password,
      path,
      port,
      query,
      scheme,
      username,
    },
  };
};

const escapeForRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const makeRule = (id, { rewrite, match }) => {
  let rewriteOptions = {
    exact: false,
  };
  if (typeof rewrite !== "string") {
    if (!rewrite || !rewrite.target) {
      throw new Error("rule.rewrite.target is required.");
    }
    rewriteOptions.exact = !!rewrite.exact;
    rewrite = rewrite.target;
  }
  let matchOptions = {
    regex: false,
  };
  if (typeof match !== "string") {
    if (!match || !match.query) {
      throw new Error("rule.match.query is required.");
    }
    matchOptions.regex = !!match.regex;
    match = match.query;
  }

  let condition, redirect;
  switch (matchOptions.regex) {
    case false:
      match = match.replace(/[^a-zA-Z0-9_-]/g, "");

      // https://stackoverflow.com/a/10444621/3761440
      match = match.replace("\\", "/");

      if (rewriteOptions.exact) {
        redirect = { url: rewrite };
      } else {
        redirect = makeRedirect(rewrite);
      }
      if (rewriteOptions.exact || !redirect.transform.path) {
        const urlFilter = "||" + match + "^";
        condition = { urlFilter };
        break;
      } else {
        // Else fall through.
        // Want to match only the TLD; according to
        // https://datatracker.ietf.org/doc/html/rfc1034#section-3.5, TLDs can
        // only contain alphanumeric characters, plus hyphens. Ensuring
        match = AUTO_REGEXP_START + escapeForRegExp(match) + AUTO_REGEXP_END;
        rewrite = (redirect.transform.scheme ? "" : "\\1") + rewrite + "\\2";
      }
    case true:
      const regexFilter = match;
      condition = { regexFilter };
      redirect = { regexSubstitution: rewrite };
      break;
    default:
      throw new Error("rule.match.regex must be one of {true, false}.");
  }

  return {
    id,
    action: { type: "redirect", redirect },
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

const METHODS = {
  getRules,
  addRule,
  replaceRule,
  deleteRule,
};

export default METHODS;
