import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  loadActivityCatalog,
  parseActivityCatalog,
} from "../docs/unsolo/plans/add-plan/activity-data.mjs";
import {
  addCalendarMonths,
  berlinToday,
  emptyDateState,
  switchDateMode,
  validateDateState,
} from "../docs/unsolo/plans/add-plan/date-state.mjs";
import {
  createDestinationSearchClient,
  parseDestinationResults,
  searchDestinationsEndpoint,
} from "../docs/unsolo/plans/add-plan/destination-search.mjs";
import {
  buildSubmitFields,
  initialContactState,
  LAUNCH_CONSENT_VERSION,
  PLAN_NOTICE_VERSION,
} from "../docs/unsolo/plans/add-plan/form-state.mjs";
import {
  createSubmissionIntent,
  createSubmitPlanClient,
  parseSubmitSuccess,
  submitPlanEndpoint,
  SubmitPlanError,
  SUCCESS_MESSAGE,
} from "../docs/unsolo/plans/add-plan/submit-client.mjs";
import {
  destinationQueryState,
  normalizeDestinationQuery,
} from "../docs/unsolo/plans/add-plan/normalization.mjs";

const root = new URL("../", import.meta.url);
const canonicalTaxonomy = JSON.parse(await readFile(new URL("docs/taxonomy.json", root), "utf8"));
const catalog = parseActivityCatalog(canonicalTaxonomy);
const fixedToday = "2026-09-10";
const uuid = "123e4567-e89b-42d3-a456-426614174000";
const destination = Object.freeze({ id: "2867714", label: "Munich, Bavaria, Germany" });
const destinationState = { selected: destination, canSubmit: true };

const form = (overrides = {}) => ({
  activity_id: "hiking",
  destination: destinationState,
  dates: { date_mode: "flexible", date_from: null, date_to: null, month_start: null },
  email: "",
  launchConsent: false,
  source: "direct",
  ...overrides,
});

const submitPlan = (overrides = {}) => ({
  id: uuid,
  activity_id: "hiking",
  activity_label: "Hiking",
  destination: destination.label,
  latitude: 48.137154,
  longitude: 11.576124,
  date_mode: "flexible",
  date_from: null,
  date_to: null,
  month_start: null,
  ...overrides,
});

const publicPlan = (overrides = {}) => ({
  id: uuid,
  activity_id: "hiking",
  activity_label: "Hiking",
  destination_label: destination.label,
  latitude: 48.137154,
  longitude: 11.576124,
  date_mode: "flexible",
  date_from: null,
  date_to: null,
  month: null,
  created_at: "2026-09-10T12:00:00.000000Z",
  ...overrides,
});

function response(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name.toLowerCase()] ?? null },
    json: async () => body,
  };
}

function manualTimers() {
  const pending = new Map();
  let id = 0;
  return {
    setTimer(fn, delay) {
      pending.set(++id, { fn, delay });
      return id;
    },
    clearTimer(timerId) {
      pending.delete(timerId);
    },
    flush() {
      const jobs = [...pending.values()];
      pending.clear();
      for (const job of jobs) job.fn();
      return jobs;
    },
    pending,
  };
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

test("destination normalization matches importer/search rules and length boundaries", () => {
  assert.equal(normalizeDestinationQuery("  MÜNCHEN—Straße  "), "munchen strasse");
  assert.deepEqual(destinationQueryState(""), { normalized: "", valid: true, searchable: false });
  assert.equal(destinationQueryState("M").searchable, false);
  assert.equal(destinationQueryState("Mü").searchable, true);
  assert.equal(destinationQueryState("x".repeat(80)).valid, true);
  assert.equal(destinationQueryState("x".repeat(81)).valid, false);
});

test("destination search debounces for 250ms and sends only normalized q", async () => {
  const timers = manualTimers();
  const requests = [];
  const client = createDestinationSearchClient({
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    fetcher: async (url, options) => {
      requests.push({ url, options });
      return response(200, { results: [destination] });
    },
  });
  client.updateQuery("M");
  assert.equal(timers.pending.size, 0);
  client.updateQuery("Mü");
  assert.equal(timers.pending.size, 1);
  const [job] = timers.pending.values();
  assert.equal(job.delay, 250);
  timers.flush();
  await settle();
  assert.equal(requests.length, 1);
  assert.deepEqual(JSON.parse(requests[0].options.body), { q: "mu" });
  assert.equal(requests[0].options.method, "POST");
  assert.equal(requests[0].options.credentials, "omit");
  assert.deepEqual(client.getState().results, [destination]);
});

test("Add Plan API clients use local test proxies and verified production functions", () => {
  assert.equal(searchDestinationsEndpoint({ location: { hostname: "127.0.0.1" } }), "/__search-destinations");
  assert.equal(submitPlanEndpoint({ location: { hostname: "localhost" } }), "/__submit-plan");
  assert.match(searchDestinationsEndpoint({ location: { hostname: "alpineart.de" } }), /zgzmixewdrzhwduvhkau\.supabase\.co\/functions\/v1\/search-destinations$/);
  assert.match(submitPlanEndpoint({ location: { hostname: "alpineart.de" } }), /zgzmixewdrzhwduvhkau\.supabase\.co\/functions\/v1\/submit-plan$/);
});

test("new destination text aborts the active request and ignores stale results", async () => {
  const timers = manualTimers();
  let resolveFirst;
  let firstSignal;
  let calls = 0;
  const first = new Promise((resolve) => { resolveFirst = resolve; });
  const client = createDestinationSearchClient({
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    fetcher: async (_url, options) => {
      calls += 1;
      if (calls === 1) {
        firstSignal = options.signal;
        return first;
      }
      return response(200, { results: [{ id: "2987410", label: "Paris, Île-de-France, France" }] });
    },
  });
  client.updateQuery("mun");
  timers.flush();
  await settle();
  client.updateQuery("par");
  assert.equal(firstSignal.aborted, true);
  timers.flush();
  await settle();
  resolveFirst(response(200, { results: [destination] }));
  await settle();
  assert.equal(client.getState().results[0].id, "2987410");
});

test("only returned canonical destinations can be selected and editing clears selection", async () => {
  const timers = manualTimers();
  let requestCount = 0;
  const client = createDestinationSearchClient({
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    fetcher: async () => {
      requestCount += 1;
      return response(200, { results: [destination] });
    },
  });
  client.updateQuery("mun");
  timers.flush();
  await settle();
  assert.throws(() => client.select("999"), /invalid_destination_selection/);
  assert.deepEqual(client.select(destination.id), destination);
  assert.equal(client.getState().canSubmit, true);
  assert.equal(client.getState().query, destination.label);
  client.updateQuery(destination.label);
  assert.equal(timers.pending.size, 0);
  assert.equal(requestCount, 1);
  assert.equal(client.getState().status, "selected");
  client.updateQuery(destination.label + "x");
  assert.equal(client.getState().selected, null);
  assert.equal(client.getState().canSubmit, false);
});

test("destination result DTO is exact, bounded and bigint-safe", () => {
  assert.deepEqual(parseDestinationResults({ results: [{ id: "9007199254740993", label: "Test" }] })[0],
    { id: "9007199254740993", label: "Test" });
  assert.throws(() => parseDestinationResults({ results: [{ id: 2867714, label: "Munich" }] }),
    /invalid_search_response/);
  assert.throws(() => parseDestinationResults({ results: [{ id: "1", label: "X", private: true }] }),
    /invalid_search_response/);
});

test("activity catalog is the canonical 43-item source and loads safely", async () => {
  assert.equal(catalog.activities.length, 43);
  assert.equal(new Set(catalog.activities.map((activity) => activity.id)).size, 43);
  assert.deepEqual(catalog.activities[0], { id: "backpacking", label: "Backpacking" });
  assert.deepEqual(catalog.activities.at(-1), { id: "yoga", label: "Yoga" });
  assert.equal(catalog.hasActivity("hiking"), true);
  assert.equal(catalog.hasActivity("invented"), false);
  const loaded = await loadActivityCatalog(async (url, options) => {
    assert.equal(url, "/taxonomy.json");
    assert.equal(options.credentials, "same-origin");
    return response(200, canonicalTaxonomy);
  });
  assert.equal(loaded.activities.length, 43);
  assert.throws(() => parseActivityCatalog({
    version: 1,
    activities: [...canonicalTaxonomy.activities.slice(0, 42), canonicalTaxonomy.activities[0]],
  }), /invalid_activity_catalog/);
});

test("date state supports exactly three modes and clears incompatible fields", () => {
  assert.deepEqual(emptyDateState("flexible"),
    { date_mode: "flexible", date_from: null, date_to: null, month_start: null });
  assert.deepEqual(switchDateMode({ date_mode: "exact", date_from: "2026-10-01", date_to: "2026-10-02" }, "month"),
    { date_mode: "month", date_from: null, date_to: null, month_start: null });
  assert.throws(() => emptyDateState("season"), /invalid_date_mode/);
});

test("date validation accepts valid exact, month and flexible modes", () => {
  assert.equal(validateDateState({
    date_mode: "exact", date_from: "2026-09-01", date_to: "2026-09-10", month_start: null,
  }, { today: fixedToday }).ok, true);
  assert.equal(validateDateState({
    date_mode: "month", date_from: null, date_to: null, month_start: "2026-09-01",
  }, { today: fixedToday }).ok, true);
  assert.equal(validateDateState(emptyDateState("flexible"), { today: fixedToday }).ok, true);
});

test("date validation rejects invalid combinations and enforces calendar horizon", () => {
  for (const dates of [
    { date_mode: "exact", date_from: "2026-09-11", date_to: "2026-09-10", month_start: null },
    { date_mode: "exact", date_from: "2026-08-01", date_to: "2026-09-09", month_start: null },
    { date_mode: "exact", date_from: "2028-09-11", date_to: "2028-09-11", month_start: null },
    { date_mode: "month", date_from: null, date_to: null, month_start: "2026-08-01" },
    { date_mode: "month", date_from: null, date_to: null, month_start: "2026-10-02" },
    { date_mode: "month", date_from: "2026-10-01", date_to: null, month_start: "2026-10-01" },
    { date_mode: "flexible", date_from: "2026-10-01", date_to: null, month_start: null },
  ]) assert.equal(validateDateState(dates, { today: fixedToday }).ok, false);
  assert.equal(addCalendarMonths("2024-02-29", 12), "2025-02-28");
  assert.match(berlinToday(new Date("2026-09-09T22:30:00Z")), /^2026-09-10$/);
});

test("no-email submission is valid and emits no consent evidence", () => {
  assert.deepEqual(initialContactState(), { email: "", launchConsent: false });
  const built = buildSubmitFields(form(), { activityCatalog: catalog, today: fixedToday });
  assert.equal(built.ok, true);
  assert.equal(built.fields.email, null);
  assert.equal(built.fields.notice_version, null);
  assert.equal(built.fields.launch_consent, null);
  assert.equal(built.fields.consent_version, null);
});

test("email requires explicit consent and uses immutable evidence versions", () => {
  const blocked = buildSubmitFields(form({ email: "person@example.test" }),
    { activityCatalog: catalog, today: fixedToday });
  assert.deepEqual(blocked, { ok: false, error: "invalid_consent" });
  const built = buildSubmitFields(form({
    email: " Person+map@Example.Test ",
    launchConsent: true,
  }), { activityCatalog: catalog, today: fixedToday });
  assert.equal(built.ok, true);
  assert.equal(built.fields.email, "person+map@example.test");
  assert.equal(built.fields.notice_version, PLAN_NOTICE_VERSION);
  assert.equal(built.fields.launch_consent, true);
  assert.equal(built.fields.consent_version, LAUNCH_CONSENT_VERSION);
});

test("form cannot submit invented activity, edited destination or invalid dates", () => {
  assert.equal(buildSubmitFields(form({ activity_id: "invented" }),
    { activityCatalog: catalog, today: fixedToday }).error, "invalid_activity");
  assert.equal(buildSubmitFields(form({ destination: { selected: destination, canSubmit: false } }),
    { activityCatalog: catalog, today: fixedToday }).error, "invalid_destination");
  assert.equal(buildSubmitFields(form({ dates: {
    date_mode: "exact", date_from: "2026-10-02", date_to: null, month_start: null,
  } }), { activityCatalog: catalog, today: fixedToday }).error, "invalid_dates");
});

test("submission intent uses one UUID for every retry and exact controlled payload", async () => {
  const fields = buildSubmitFields(form(), { activityCatalog: catalog, today: fixedToday }).fields;
  const intent = createSubmissionIntent(fields, () => uuid);
  const sent = [];
  let count = 0;
  const client = createSubmitPlanClient({
    fetcher: async (_url, options) => {
      sent.push(JSON.parse(options.body));
      count += 1;
      return response(count === 1 ? 201 : 200, {
        version: 1, result: count === 1 ? "created" : "replayed", plan: submitPlan(),
      });
    },
    publicFeedFetcher: async () => ({ version: 1, truncated: false, plans: [publicPlan()] }),
  });
  assert.equal((await client.submit(intent)).result, "created");
  assert.equal((await client.submit(intent)).result, "replayed");
  assert.equal(sent[0].idempotency_key, uuid);
  assert.equal(sent[1].idempotency_key, uuid);
  assert.deepEqual(sent[0], sent[1]);
  assert.equal(Object.keys(sent[0]).length, 12);
});

test("successful submit refreshes public feed and exposes map focus state", async () => {
  const intent = createSubmissionIntent(
    buildSubmitFields(form(), { activityCatalog: catalog, today: fixedToday }).fields,
    () => uuid,
  );
  let refreshed = 0;
  const result = await createSubmitPlanClient({
    fetcher: async () => response(201, { version: 1, result: "created", plan: submitPlan() }),
    publicFeedFetcher: async () => {
      refreshed += 1;
      return { version: 1, truncated: false, plans: [publicPlan()] };
    },
  }).submit(intent);
  assert.equal(refreshed, 1);
  assert.equal(result.publicPlan.id, uuid);
  assert.deepEqual(result.focus, { planId: uuid, latitude: 48.137154, longitude: 11.576124 });
  assert.deepEqual(result.message, SUCCESS_MESSAGE);
});

test("committed success remains success when public feed refresh is unavailable", async () => {
  const intent = createSubmissionIntent(
    buildSubmitFields(form(), { activityCatalog: catalog, today: fixedToday }).fields,
    () => uuid,
  );
  const result = await createSubmitPlanClient({
    fetcher: async () => response(201, { version: 1, result: "created", plan: submitPlan() }),
    publicFeedFetcher: async () => { throw new Error("offline"); },
  }).submit(intent);
  assert.equal(result.status, "success");
  assert.equal(result.feedStatus, "unavailable");
  assert.equal(result.publicPlan, null);
  assert.equal(result.focus.planId, uuid);
});

test("backend failures map to controlled frontend states without internal details", async () => {
  const cases = [
    [422, { error: "invalid_destination" }, {}, "validation"],
    [409, { error: "idempotency_conflict" }, {}, "conflict"],
    [429, { error: "rate_limited" }, { "retry-after": "42" }, "rate_limited"],
    [503, { error: "submissions_paused" }, {}, "kill_switch"],
    [503, { error: "global_limit_reached" }, { "retry-after": "60" }, "global_limit"],
    [503, { error: "temporarily_unavailable", detail: "private" }, {}, "temporary_failure"],
  ];
  const intent = createSubmissionIntent(
    buildSubmitFields(form(), { activityCatalog: catalog, today: fixedToday }).fields,
    () => uuid,
  );
  for (const [status, body, headers, kind] of cases) {
    const client = createSubmitPlanClient({ fetcher: async () => response(status, body, headers) });
    await assert.rejects(client.submit(intent), (error) => {
      assert.ok(error instanceof SubmitPlanError);
      assert.equal(error.kind, kind);
      assert.doesNotMatch(error.message, /private|sql|credential/i);
      if (kind === "rate_limited") assert.equal(error.retryAfter, 42);
      return true;
    });
  }
});

test("submit response accepts only the verified public success DTO", () => {
  assert.equal(parseSubmitSuccess({ version: 1, result: "created", plan: submitPlan() }).plan.id, uuid);
  assert.equal(parseSubmitSuccess({ version: 1, result: "replayed", plan: null }).plan, null);
  assert.throws(() => parseSubmitSuccess({ version: 1, result: "created", plan: null }),
    /invalid_submit_response/);
  assert.throws(() => parseSubmitSuccess({
    version: 1, result: "created", plan: submitPlan({ destination_id: "2867714" }),
  }), /invalid_submit_response/);
  assert.throws(() => createSubmissionIntent({ idempotency_key: uuid }, () => uuid),
    /invalid_submission_fields/);
});
