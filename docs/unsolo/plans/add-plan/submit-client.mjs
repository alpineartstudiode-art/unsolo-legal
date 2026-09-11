import { fetchPublicPlans } from "../plans.mjs";

export const SUBMIT_PLAN_ENDPOINT =
  "https://zgzmixewdrzhwduvhkau.supabase.co/functions/v1/submit-plan";
export const SUCCESS_MESSAGE = Object.freeze([
  "Your plan is already on the map 👀",
  "Go find it.",
]);

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function submitPlanEndpoint(scope = globalThis) {
  const host = scope.location?.hostname;
  return host === "127.0.0.1" || host === "localhost"
    ? "/__submit-plan"
    : SUBMIT_PLAN_ENDPOINT;
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function validDate(value) {
  return value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function validSubmitPlan(value) {
  return exactKeys(value, ["activity_id", "activity_label", "date_from", "date_mode", "date_to",
    "destination", "id", "latitude", "longitude", "month_start"]) &&
    UUID_V4.test(value.id) && typeof value.activity_id === "string" &&
    typeof value.activity_label === "string" && typeof value.destination === "string" &&
    Number.isFinite(value.latitude) && value.latitude >= -90 && value.latitude <= 90 &&
    Number.isFinite(value.longitude) && value.longitude >= -180 && value.longitude <= 180 &&
    ["exact", "month", "flexible"].includes(value.date_mode) &&
    validDate(value.date_from) && validDate(value.date_to) && validDate(value.month_start);
}

export function parseSubmitSuccess(value) {
  if (!exactKeys(value, ["plan", "result", "version"]) || value.version !== 1 ||
      !["created", "replayed"].includes(value.result) ||
      (value.plan === null ? value.result !== "replayed" : !validSubmitPlan(value.plan))) {
    throw new Error("invalid_submit_response");
  }
  return value;
}

export class SubmitPlanError extends Error {
  constructor(kind, { retryAfter = null } = {}) {
    super(kind);
    this.name = "SubmitPlanError";
    this.kind = kind;
    this.retryAfter = retryAfter;
  }
}

function safeRetryAfter(response) {
  const value = response.headers?.get?.("Retry-After");
  return value && /^\d+$/.test(value) ? Number(value) : null;
}

async function classifyFailure(response) {
  let code = null;
  try {
    const body = await response.json();
    if (exactKeys(body, ["error"]) && typeof body.error === "string") code = body.error;
  } catch { /* Non-JSON failures remain controlled. */ }
  const retryAfter = safeRetryAfter(response);
  if (response.status === 409 && code === "idempotency_conflict") {
    throw new SubmitPlanError("conflict");
  }
  if (response.status === 429 && code === "rate_limited") {
    throw new SubmitPlanError("rate_limited", { retryAfter });
  }
  if (response.status === 503 && code === "submissions_paused") {
    throw new SubmitPlanError("kill_switch");
  }
  if (response.status === 503 && code === "global_limit_reached") {
    throw new SubmitPlanError("global_limit", { retryAfter });
  }
  if ([400, 413, 415, 422].includes(response.status) && code) {
    throw new SubmitPlanError("validation");
  }
  throw new SubmitPlanError("temporary_failure");
}

export function createSubmissionIntent(fields, randomUUID = () => globalThis.crypto.randomUUID()) {
  const idempotencyKey = randomUUID().toLowerCase();
  if (!UUID_V4.test(idempotencyKey)) throw new Error("secure_uuid_unavailable");
  if (!fields || typeof fields !== "object" || Array.isArray(fields) || "idempotency_key" in fields) {
    throw new Error("invalid_submission_fields");
  }
  return Object.freeze({
    idempotencyKey,
    payload: Object.freeze({ ...structuredClone(fields), idempotency_key: idempotencyKey }),
  });
}

export function createSubmitPlanClient({
  fetcher = fetch,
  endpoint = submitPlanEndpoint(),
  publicFeedFetcher = () => fetchPublicPlans(fetcher),
} = {}) {
  return Object.freeze({
    async submit(intent) {
      if (!intent || !UUID_V4.test(intent.idempotencyKey) ||
          intent.payload?.idempotency_key !== intent.idempotencyKey) {
        throw new Error("invalid_submission_intent");
      }
      let response;
      try {
        response = await fetcher(endpoint, {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          cache: "no-store",
          referrerPolicy: "no-referrer",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(intent.payload),
        });
      } catch {
        throw new SubmitPlanError("temporary_failure");
      }
      if (!response.ok) await classifyFailure(response);
      let success;
      try { success = parseSubmitSuccess(await response.json()); }
      catch { throw new SubmitPlanError("temporary_failure"); }
      if (success.plan === null) {
        return Object.freeze({
          status: "success",
          result: "replayed",
          plan: null,
          feed: null,
          feedStatus: "not_applicable",
          publicPlan: null,
          focus: null,
          message: SUCCESS_MESSAGE,
        });
      }
      let feed = null;
      let feedStatus = "unavailable";
      try {
        feed = await publicFeedFetcher();
        feedStatus = "ready";
      } catch { /* The committed submit remains successful if refresh lags/fails. */ }
      const publicPlan = feed?.plans.find((plan) => plan.id === success.plan.id) ?? null;
      const focus = Object.freeze({
        planId: success.plan.id,
        latitude: publicPlan?.latitude ?? success.plan.latitude,
        longitude: publicPlan?.longitude ?? success.plan.longitude,
      });
      return Object.freeze({
        status: "success",
        result: success.result,
        plan: success.plan,
        feed,
        feedStatus,
        publicPlan,
        focus,
        message: SUCCESS_MESSAGE,
      });
    },
  });
}
