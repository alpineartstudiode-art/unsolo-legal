export const ACTIVITY_CATALOG_URL = "/taxonomy.json";

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export function parseActivityCatalog(value) {
  if (!exactKeys(value, ["activities", "version"]) || value.version !== 1 ||
      !Array.isArray(value.activities) || value.activities.length !== 43) {
    throw new Error("invalid_activity_catalog");
  }
  const ids = new Set();
  const activities = value.activities.map((activity) => {
    if (!exactKeys(activity, ["id", "label"]) ||
        typeof activity.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(activity.id) ||
        typeof activity.label !== "string" || !activity.label.trim() || ids.has(activity.id)) {
      throw new Error("invalid_activity_catalog");
    }
    ids.add(activity.id);
    return Object.freeze({ id: activity.id, label: activity.label });
  });
  return Object.freeze({
    version: 1,
    activities: Object.freeze(activities),
    hasActivity: (id) => ids.has(id),
  });
}

export async function loadActivityCatalog(fetcher = fetch, url = ACTIVITY_CATALOG_URL) {
  const response = await fetcher(url, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("activity_catalog_unavailable");
  return parseActivityCatalog(await response.json());
}
