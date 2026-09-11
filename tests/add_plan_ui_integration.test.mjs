import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  dateStateFromValues,
  FORM_ERROR_COPY,
  monthValueToStart,
  submitErrorCopy,
} from "../docs/unsolo/plans/add-plan/add-plan-ui.mjs";
import { SubmitPlanError } from "../docs/unsolo/plans/add-plan/submit-client.mjs";

const root = new URL("../docs/unsolo/plans/", import.meta.url);

test("integrated dialog contains only the controlled V1 fields", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  for (const value of ["activity_id", "destination", "date_mode", "date_from", "date_to", "month", "email", "launch_consent"]) {
    assert.match(html, new RegExp(`name="${value}"`));
  }
  assert.doesNotMatch(html, /name="(?:free_text|status|seed|source|destination_id|latitude|longitude|expires_at)"/);
  assert.match(html, /role="combobox"[^>]*aria-autocomplete="list"[^>]*aria-controls="destination-results"/s);
  assert.match(html, /value="exact"/);
  assert.match(html, /value="month"/);
  assert.match(html, /value="flexible" checked/);
});

test("optional email uses approved immutable consent evidence and canonical notice link", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const script = await readFile(new URL("add-plan/form-state.mjs", root), "utf8");
  assert.match(html, /Want to know when UnSolo launches\?/);
  assert.match(html, /Leave your email\. It won’t appear on the map\./);
  assert.match(html, /Email me when UnSolo launches\./);
  assert.match(html, /href="\.\.\/legal\/plan-map-privacy\.html"/);
  assert.doesNotMatch(html.match(/id="plan-launch-consent"[^>]*>/)?.[0] ?? "", /checked/);
  assert.match(script, /plan-map-privacy-v1\.1/);
  assert.match(script, /launch-notification-consent-v1\.0/);
});

test("date UI emits exactly the three backend date shapes", () => {
  assert.deepEqual(dateStateFromValues({ mode: "exact", dateFrom: "2027-06-10", dateTo: "2027-06-12" }), {
    date_mode: "exact", date_from: "2027-06-10", date_to: "2027-06-12", month_start: null,
  });
  assert.deepEqual(dateStateFromValues({ mode: "month", month: "2027-06" }), {
    date_mode: "month", date_from: null, date_to: null, month_start: "2027-06-01",
  });
  assert.deepEqual(dateStateFromValues({ mode: "flexible" }), {
    date_mode: "flexible", date_from: null, date_to: null, month_start: null,
  });
  assert.equal(monthValueToStart("2027-06"), "2027-06-01");
  assert.equal(monthValueToStart("June 2027"), null);
});

test("native Month picker shows the approved empty-state label without changing its type", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("plans.css", root), "utf8");
  const ui = await readFile(new URL("add-plan/add-plan-ui.mjs", root), "utf8");
  assert.match(html, /<input id="plan-month" name="month" type="month">/);
  assert.doesNotMatch(html, /<input id="plan-month"[^>]*required/);
  assert.match(html, /class="month-input-placeholder" aria-hidden="true">Select month<\/span>/);
  assert.match(css, /\.month-input-placeholder\s*\{[\s\S]*?color: var\(--text-muted\);/);
  assert.match(css, /\.month-input-shell\.has-value \.month-input-placeholder \{ display: none; \}/);
  assert.match(ui, /monthShell\?\.classList\.toggle\("has-value", Boolean\(month\.value\)\)/);
});

test("all backend failures stay in simple user-facing language", () => {
  for (const kind of ["validation", "rate_limited", "kill_switch", "global_limit", "conflict", "temporary_failure"]) {
    const copy = submitErrorCopy(new SubmitPlanError(kind));
    assert.equal(copy, FORM_ERROR_COPY[kind]);
    assert.doesNotMatch(copy, /idempotency|SQL|database|credential|HTTP|503|429/i);
  }
});

test("form scroll is confined to the panel and the approved shell stays unchanged", async () => {
  const css = await readFile(new URL("plans.css", root), "utf8");
  assert.match(css, /\.add-plan-dialog\s*\{[\s\S]*?height: 100%;[\s\S]*?overflow: hidden;/);
  assert.match(css, /\.add-plan-panel\s*\{[\s\S]*?max-height:[\s\S]*?100dvh[\s\S]*?overflow: hidden;/);
  assert.match(css, /\.add-plan-fields\s*\{[\s\S]*?overflow-y: auto;[\s\S]*?overscroll-behavior: contain;/);
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 600px\)[\s\S]*?\.add-plan-panel[^}]*max-height: calc\(100dvh/);
});

test("success flow refreshes the feed and never auto-enables Google Maps", async () => {
  const script = await readFile(new URL("add-plan/add-plan-ui.mjs", root), "utf8");
  assert.match(script, /if \(result\.feed\) applyPublicFeed\(result\.feed\)/);
  assert.match(script, /if \(mapWasActive && result\.focus\) focusPlanOnMap\(result\.focus\)/);
  assert.match(script, /if \(!mapWasActive\) mapConsentButton\.focus\(\)/);
  assert.doesNotMatch(script, /activateMap\(|setConsent\(/);
});
