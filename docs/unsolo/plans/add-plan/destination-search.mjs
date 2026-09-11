import { destinationQueryState } from "./normalization.mjs";

export const SEARCH_DESTINATIONS_ENDPOINT =
  "https://zgzmixewdrzhwduvhkau.supabase.co/functions/v1/search-destinations";

export function searchDestinationsEndpoint(scope = globalThis) {
  const host = scope.location?.hostname;
  return host === "127.0.0.1" || host === "localhost"
    ? "/__search-destinations"
    : SEARCH_DESTINATIONS_ENDPOINT;
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export function parseDestinationResults(value) {
  if (!exactKeys(value, ["results"]) || !Array.isArray(value.results) || value.results.length > 8) {
    throw new Error("invalid_search_response");
  }
  const seen = new Set();
  const results = value.results.map((item) => {
    if (!exactKeys(item, ["id", "label"]) || typeof item.id !== "string" ||
        !/^[1-9][0-9]{0,18}$/.test(item.id) || typeof item.label !== "string" ||
        !item.label.trim() || seen.has(item.id)) {
      throw new Error("invalid_search_response");
    }
    seen.add(item.id);
    return Object.freeze({ id: item.id, label: item.label });
  });
  return Object.freeze(results);
}

export function createDestinationSearchClient({
  fetcher = fetch,
  endpoint = searchDestinationsEndpoint(),
  delay = 250,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  let timer = null;
  let controller = null;
  let generation = 0;
  let state = Object.freeze({
    query: "", normalizedQuery: "", status: "idle", results: Object.freeze([]),
    selected: null, canSubmit: false,
  });
  const listeners = new Set();
  const publish = (patch) => {
    state = Object.freeze({ ...state, ...patch });
    for (const listener of listeners) listener(state);
  };
  const cancelPending = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
    controller?.abort();
    controller = null;
  };
  const run = async (requestGeneration, normalized) => {
    controller = new AbortController();
    const signal = controller.signal;
    publish({ status: "loading", results: Object.freeze([]) });
    try {
      const response = await fetcher(endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ q: normalized }),
        signal,
      });
      if (requestGeneration !== generation) return;
      if (!response.ok) {
        const status = response.status === 429 ? "rate_limited" : "unavailable";
        publish({ status, results: Object.freeze([]) });
        return;
      }
      publish({ status: "ready", results: parseDestinationResults(await response.json()) });
    } catch (error) {
      if (signal.aborted || requestGeneration !== generation) return;
      publish({ status: "unavailable", results: Object.freeze([]) });
    } finally {
      if (requestGeneration === generation) controller = null;
    }
  };
  return Object.freeze({
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    updateQuery(query) {
      if (typeof query !== "string") query = "";
      generation += 1;
      cancelPending();
      const queryInfo = destinationQueryState(query);
      const selected = state.selected?.label === query ? state.selected : null;
      const base = { query, normalizedQuery: queryInfo.normalized, selected, canSubmit: Boolean(selected) };
      if (selected) {
        publish({ ...base, status: "selected", results: Object.freeze([]) });
      } else if (!queryInfo.valid) {
        publish({ ...base, status: "invalid", results: Object.freeze([]) });
      } else if (!queryInfo.searchable) {
        publish({ ...base, status: "idle", results: Object.freeze([]) });
      } else {
        publish({ ...base, status: "waiting", results: Object.freeze([]) });
        const requestGeneration = generation;
        timer = setTimer(() => {
          timer = null;
          void run(requestGeneration, queryInfo.normalized);
        }, delay);
      }
      return state;
    },
    select(id) {
      const selected = state.results.find((item) => item.id === id);
      if (!selected) throw new Error("invalid_destination_selection");
      cancelPending();
      generation += 1;
      publish({ query: selected.label, normalizedQuery: destinationQueryState(selected.label).normalized,
        selected, canSubmit: true, status: "selected", results: Object.freeze([]) });
      return selected;
    },
    clear() {
      generation += 1;
      cancelPending();
      publish({ query: "", normalizedQuery: "", status: "idle", results: Object.freeze([]),
        selected: null, canSubmit: false });
    },
    dispose() {
      generation += 1;
      cancelPending();
      listeners.clear();
    },
  });
}
