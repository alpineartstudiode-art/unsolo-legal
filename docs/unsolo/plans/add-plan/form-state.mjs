import { validateDateState } from "./date-state.mjs";

export const PLAN_NOTICE_VERSION = "plan-map-privacy-v1.1";
export const LAUNCH_CONSENT_VERSION = "launch-notification-consent-v1.0";
export const SUBMIT_SOURCES = Object.freeze(new Set([
  "instagram", "tiktok", "threads", "youtube", "pinterest", "qr", "direct", "unknown",
]));

export function initialContactState() {
  return Object.freeze({ email: "", launchConsent: false });
}

function validEmail(email) {
  return [...email].length <= 254 && !/[\p{C}\s]/u.test(email) &&
    /^[^@]+@[^@]+\.[^@]+$/u.test(email);
}

export function buildSubmitFields(form, { activityCatalog, today } = {}) {
  if (!form || activityCatalog?.hasActivity?.(form.activity_id) !== true) {
    return { ok: false, error: "invalid_activity" };
  }
  const selected = form.destination?.selected;
  if (!selected || form.destination?.canSubmit !== true ||
      typeof selected.id !== "string" || !/^[1-9][0-9]{0,18}$/.test(selected.id)) {
    return { ok: false, error: "invalid_destination" };
  }
  const dates = validateDateState(form.dates, { today });
  if (!dates.ok) return dates;
  const email = typeof form.email === "string" ? form.email.trim().toLowerCase() : "";
  if (email && !validEmail(email)) return { ok: false, error: "invalid_email" };
  if (email && form.launchConsent !== true) return { ok: false, error: "invalid_consent" };
  const requestedSource = typeof form.source === "string" ? form.source : "direct";
  const source = SUBMIT_SOURCES.has(requestedSource) ? requestedSource : "unknown";
  return {
    ok: true,
    fields: Object.freeze({
      activity_id: form.activity_id,
      destination_id: selected.id,
      ...dates.fields,
      email: email || null,
      source,
      notice_version: email ? PLAN_NOTICE_VERSION : null,
      launch_consent: email ? true : null,
      consent_version: email ? LAUNCH_CONSENT_VERSION : null,
    }),
  };
}
