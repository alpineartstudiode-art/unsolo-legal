import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  clusterPlans,
  configuredMapsKey,
  fetchPublicPlans,
  formatPlanDates,
  googleMapsUrl,
  markerGroups,
  parsePublicFeed,
  popupModel,
  publicPlansEndpoint,
} from "../docs/unsolo/plans/plans.mjs";

const root = new URL("../docs/unsolo/plans/", import.meta.url);
const plan = (overrides = {}) => ({
  id: "10000000-0000-4000-8000-000000000001",
  activity_id: "hiking",
  activity_label: "Hiking",
  destination_label: "Munich, Bavaria, Germany",
  latitude: 48.137154,
  longitude: 11.576124,
  date_mode: "exact",
  date_from: "2027-06-10",
  date_to: "2027-06-12",
  month: null,
  created_at: "2026-09-09T10:00:00.000000Z",
  ...overrides,
});

test("accepts the exact public V1 DTO", () => {
  const result = parsePublicFeed({ version: 1, truncated: false, plans: [plan()] });
  assert.equal(result.plans.length, 1);
});

test("rejects unknown API versions and private fields", () => {
  assert.throws(() => parsePublicFeed({ version: 2, truncated: false, plans: [] }), /unsupported_version/);
  assert.throws(() => parsePublicFeed({ version: 1, truncated: false, plans: [plan({ destination_id: "2867714" })] }), /invalid_feed/);
  assert.throws(() => parsePublicFeed({ version: 1, truncated: false, plans: [plan({ email: "no@example.invalid" })] }), /invalid_feed/);
});

test("enforces the 1000 item public contract", () => {
  const plans = Array.from({ length: 1001 }, (_, index) => plan({ id: String(index) }));
  assert.throws(() => parsePublicFeed({ version: 1, truncated: true, plans }), /invalid_feed/);
});

test("formats all three date modes", () => {
  assert.match(formatPlanDates(plan()), /Jun 10, 2027/);
  assert.equal(formatPlanDates(plan({ date_mode: "month", date_from: null, date_to: null, month: "2027-06-01" })), "June 2027");
  assert.equal(formatPlanDates(plan({ date_mode: "flexible", date_from: null, date_to: null })), "Flexible dates");
});

test("clusters nearby plans at wide zoom without changing coordinates", () => {
  const first = plan();
  const second = plan({ id: "10000000-0000-4000-8000-000000000002", latitude: 48.14, longitude: 11.58 });
  assert.deepEqual(clusterPlans([first, second], 5).map((group) => group.length), [2]);
  assert.equal(first.latitude, 48.137154);
  assert.equal(second.longitude, 11.58);
});

test("keeps separate nearby plans at close zoom and groups exact overlaps", () => {
  const close = plan({ id: "10000000-0000-4000-8000-000000000002", latitude: 48.14 });
  assert.equal(clusterPlans([plan(), close], 11).length, 2);
  assert.equal(clusterPlans([plan(), plan({ id: "10000000-0000-4000-8000-000000000003" })], 11).length, 1);
});

test("turns public DTOs into marker models without private data", () => {
  const markers = markerGroups([plan()], 11);
  assert.deepEqual(Object.keys(markers[0]).sort(), ["count", "latitude", "longitude", "plans", "title"]);
  assert.equal(markers[0].count, 1);
  assert.equal(markers[0].title, "Hiking in Munich, Bavaria, Germany");
});

test("popup model contains only activity, destination and dates", () => {
  assert.deepEqual(Object.keys(popupModel([plan()])[0]).sort(), ["activity", "dates", "destination"]);
});

test("fetch uses the public endpoint with a private-free GET", async () => {
  let request;
  const feed = await fetchPublicPlans(async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ version: 1, truncated: false, plans: [] }) };
  });
  assert.equal(feed.plans.length, 0);
  assert.match(request.url, /zgzmixewdrzhwduvhkau\.supabase\.co\/functions\/v1\/public-plans$/);
  assert.equal(request.options.method, "GET");
  assert.equal(request.options.credentials, "omit");
  assert.equal(request.options.cache, "no-store");
});

test("local browser verification uses only the read-only same-origin proxy", () => {
  assert.equal(publicPlansEndpoint({ location: { hostname: "127.0.0.1" } }), "/__public-plans");
  assert.equal(publicPlansEndpoint({ location: { hostname: "localhost" } }), "/__public-plans");
  assert.match(publicPlansEndpoint({ location: { hostname: "alpineart.de" } }), /supabase\.co\/functions\/v1\/public-plans$/);
});

test("Google resources are absent from HTML and created only by the consent loader", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.doesNotMatch(html, /<(?:script|iframe)[^>]+(?:googleapis|gstatic)/i);
  assert.doesNotMatch(html, /rel=["'](?:preconnect|dns-prefetch|preload)["'][^>]+google/i);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.match(html, /<script src="maps-key\.js"><\/script>/);
  assert.doesNotMatch(html, /maps-key\.(?:dev\.)?local\.js/);
  assert.match(googleMapsUrl("test-key"), /^https:\/\/maps\.googleapis\.com\/maps\/api\/js\?/);
  assert.match(googleMapsUrl("test-key"), /loading=async/);
  assert.equal(configuredMapsKey({}), "");
  assert.equal(configuredMapsKey({ __UNSOLO_PLAN_MAP_CONFIG__: { googleMapsApiKey: " local-key " } }), "local-key");
});

test("route uses approved branding and opens the Add Plan dialog", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /Going somewhere\?/);
  assert.match(html, /See who else has plans\./);
  const headline = html.match(/<div class="headline-block">([\s\S]*?)<\/div>/)?.[1] ?? "";
  assert.doesNotMatch(headline, /UnSolo Plan Map/i);
  assert.match(headline, /class="headline-title">Going somewhere\?<\/span><span class="headline-subtitle">See who else has plans\.<\/span>/);
  assert.match(html, /aria-hidden="true">\+<\/span> Add your plan/);
  assert.match(html, /class="add-plan-button" id="add-plan-open"[^>]+aria-haspopup="dialog"/);
  assert.match(html, /\.\.\/download\/assets\/logo\.png/);
  assert.match(html, /<dialog class="add-plan-dialog" id="add-plan-dialog"/);
  assert.match(html, /<form class="add-plan-form" id="add-plan-form" novalidate>/);
  assert.doesNotMatch(html.match(/<button class="add-plan-button"[^>]*>/)?.[0] ?? "", /disabled|is-coming-soon/);
  assert.match(html, /id="maps-consent-detail">Google Maps is off\./);
  assert.match(html, /data outside the EEA, including in the US/);
  assert.match(html, /href="\.\.\/legal\/plan-map-privacy\.html">Plan Map Privacy Notice/);
  assert.match(html, /href="\.\.\/legal\/impressum\.html">Impressum/);
});

test("revoke preserves the verified reload path and shows approved result copy", async () => {
  const script = await readFile(new URL("plans.mjs", root), "utf8");
  assert.match(script, /unsolo-plan-map-google-revoked-v1/);
  assert.match(script, /Google Maps is off\. Your saved choice was removed\. The page will not contact Google Maps again unless you choose to load it\./);
  assert.match(script, /#turn-off-map[\s\S]*?setConsent\(false\);[\s\S]*?rememberRevocation\(\);[\s\S]*?location\.reload\(\);/);
});

test("uses only approved app tokens and self-hosted Poppins", async () => {
  const css = await readFile(new URL("plans.css", root), "utf8");
  for (const token of [
    "--background: #1A1D26",
    "--surface: #2B2F3A",
    "--surface-elevated: #3B4151",
    "--text-primary: #F3ECE3",
    "--text-secondary: #9C9A97",
    "--text-muted: #67686D",
    "--primary: #EC6C9F",
    "--winter-muted: #B9A9FF",
    "--error-muted: #FFAC9D",
  ]) assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(css, /linear-gradient\(90deg, var\(--winter-muted\) 0%, var\(--error-muted\) 100%\)/);
  assert.doesNotMatch(css, /#8CA6B3|--text-soft|font-weight:\s*500|fonts\.(?:googleapis|gstatic)\.com/i);
  for (const [weight, file] of [[300, "poppins-300.ttf"], [400, "poppins-400.ttf"], [600, "poppins-600.ttf"], [700, "poppins-700.ttf"]]) {
    assert.match(css, new RegExp(`font-weight: ${weight};[\\s\\S]*?${file.replace(".", "\\.")}`));
    assert.ok((await readFile(new URL(`assets/fonts/${file}`, root))).length > 100_000);
  }
});

test("switches the Add Plan CTA hierarchy only after the map is loaded", async () => {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex) => {
    const values = hex.match(/[0-9a-f]{2}/gi).map((part) => channel(Number.parseInt(part, 16)));
    return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
  };
  const contrast = (first, second) => {
    const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
  };
  assert.ok(contrast("#000000", "#B9A9FF") >= 4.5);
  assert.ok(contrast("#000000", "#FFAC9D") >= 4.5);
  const css = await readFile(new URL("plans.css", root), "utf8");
  assert.match(css, /\.consent-button,[\s\S]*?background: var\(--brand-gradient\);[\s\S]*?color: var\(--text-accessibility-dark\);/);
  assert.match(css, /\.add-plan-button\s*\{[\s\S]*?border: 1px solid var\(--primary\);[\s\S]*?background: transparent;[\s\S]*?color: var\(--primary\);[\s\S]*?box-shadow: none;/);
  assert.match(css, /body:has\(#map-canvas:not\(\[hidden\]\)\) \.add-plan-button\s*\{[\s\S]*?border-color: transparent;[\s\S]*?background: var\(--brand-gradient\);[\s\S]*?color: var\(--text-accessibility-dark\);[\s\S]*?box-shadow: none;[\s\S]*?transform: none;/);
  assert.match(css, /\.add-plan-button:disabled,[\s\S]*?border-color: transparent;[\s\S]*?background: var\(--surface-elevated\);[\s\S]*?color: var\(--text-muted\);[\s\S]*?box-shadow: none;/);
  const mapLoadedStyle = css.match(/body:has\(#map-canvas:not\(\[hidden\]\)\) \.add-plan-button\s*\{([\s\S]*?)\}/)?.[1] ?? "";
  assert.match(mapLoadedStyle, /box-shadow: none;/);
  assert.equal(mapLoadedStyle.match(/box-shadow:/g)?.length, 1);
  assert.doesNotMatch(mapLoadedStyle, /glow|translateY/);
});

test("fits the map shell to the dynamic viewport without clipping status or footer", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const css = await readFile(new URL("plans.css", root), "utf8");
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/);
  assert.match(css, /\.page-shell\s*\{[\s\S]*?grid-template-rows: auto minmax\(0, 1fr\) auto;[\s\S]*?height: 100dvh;/);
  assert.match(css, /\.map-shell\s*\{[\s\S]*?grid-template-rows: minmax\(0, 1fr\) auto;/);
  assert.match(css, /\.map-card\s*\{[\s\S]*?height: 100%;[\s\S]*?min-height: 0;/);
  assert.doesNotMatch(css, /\.map-card\s*\{[\s\S]*?min-height:\s*(?:clamp|min)\(/);
  assert.match(css, /env\(safe-area-inset-(?:top|right|bottom|left)\)/);
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 600px\)/);
});

test("keeps the reviewed logo alignment with a compact two-line headline", async () => {
  const css = await readFile(new URL("plans.css", root), "utf8");
  assert.match(css, /\.headline-block \{ min-width: 0; align-self: center; \}/);
  assert.match(css, /h1\s*\{[\s\S]*?display: grid;[\s\S]*?gap: 0;/);
  assert.match(css, /\.headline-subtitle\s*\{[\s\S]*?margin-top: 0;[\s\S]*?font-size: 16px;[\s\S]*?line-height: 24px;/);
});

test("keeps the short-landscape consent stack inside the map card", async () => {
  const css = await readFile(new URL("plans.css", root), "utf8");
  const landscape = css.match(/@media \(orientation: landscape\) and \(max-height: 600px\) \{([\s\S]*?)\n\}/)?.[1];
  assert.ok(landscape);
  assert.match(landscape, /\.consent-panel \{ padding: 6px 18px; \}/);
  assert.match(landscape, /\.consent-art \{ display: none; \}/);
  assert.match(landscape, /\.consent-copy \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) minmax\(210px, 240px\);/);
  assert.match(landscape, /\.map-kicker \{[^}]*font-size: 12px;[^}]*line-height: 14px;/);
  assert.match(landscape, /\.consent-copy h2 \{[^}]*font-size: 18px;[^}]*line-height: 22px;/);
  assert.match(landscape, /\.consent-copy p:not\(\.map-kicker\) \{[^}]*font-size: 13px;[^}]*line-height: 16px;/);
  assert.match(landscape, /\.consent-button \{[^}]*min-height: 52px;/);
  assert.match(landscape, /\.privacy-link \{[^}]*font-size: 13px;[^}]*line-height: 18px;/);
});
