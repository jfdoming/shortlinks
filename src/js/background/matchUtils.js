export const AUTO_REGEXP_START = "^((?:[^/]+://)?(?:[a-zA-Z0-9-]*)?)";
export const AUTO_REGEXP_END = "(/.*|$)";

export const isRegexMatch = (redirect, match, autoRegexp = null) =>
  redirect?.regexSubstitution?.endsWith("\\2") &&
  match.startsWith(autoRegexp?.start ?? AUTO_REGEXP_START) &&
  match.endsWith(autoRegexp?.end ?? AUTO_REGEXP_END);

export const getFilter = ({ regexFilter, urlFilter }) =>
  regexFilter || urlFilter.slice(2, -1);
