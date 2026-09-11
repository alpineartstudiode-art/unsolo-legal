import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const repo = new URL("../", import.meta.url);
const privacy = await readFile(new URL("docs/unsolo/legal/plan-map-privacy.html", repo), "utf8");
const impressum = await readFile(new URL("docs/unsolo/legal/impressum.html", repo), "utf8");
const publishCopy = await readFile(new URL("legal/PLAN_MAP_PUBLISH_COPY.md", repo), "utf8");

test("Plan Map notice has the canonical identity and immutable versions", () => {
  assert.match(privacy, /https:\/\/alpineart\.de\/unsolo\/legal\/plan-map-privacy\.html/);
  assert.match(privacy, /Daria Fokina/);
  assert.match(privacy, /Alpine Art Studio/);
  assert.match(privacy, /Veilchenweg 16/);
  assert.match(privacy, /88046 Friedrichshafen/);
  assert.match(privacy, /unsolo\.box@gmail\.com/);
  assert.match(privacy, /plan-map-privacy-v1\.1/g);
  assert.match(privacy, /launch-notification-consent-v1\.0/g);
});

test("notice reflects the verified services, logging boundary and retention", () => {
  for (const required of [
    "GitHub Pages",
    "Supabase",
    "EU Frankfurt region",
    "one day",
    "einen Tag",
    "48 hours",
    "48 Stunden",
    "24 hours",
    "24 Stunden",
    "retained for 30 days after they became inactive",
    "für 30 Tage ab Beginn der\\s+Inaktivität",
    "90 × 24 hours",
    "90 × 24 Stunden",
    "three Berlin calendar\\s+years",
    "drei Berliner Kalenderjahre",
    "were not observed",
  ]) assert.match(privacy, new RegExp(required));
  assert.match(privacy, /The raw IP address is not stored in Plan Map business tables/);
  assert.match(privacy, /request and response bodies,[\s\S]*were not observed/);
  assert.match(privacy, /infrastructure never processes technical metadata/);
});

test("notice accurately separates GeoNames destination search from consented Maps", () => {
  assert.match(privacy, /local snapshot of GeoNames/);
  assert.match(privacy, /does not use Google Places/);
  assert.match(privacy, /Google Maps JavaScript does not load before/);
  assert.match(privacy, /makes no Google Maps, Google iframe, Google preconnect, Google preload, or\s+Google Fonts request/);
  assert.match(privacy, /Turn off Google Maps/);
});

test("GeoNames attribution has source, license, and adaptation indication", () => {
  for (const document of [privacy, publishCopy]) {
    assert.match(document, /Destination data ©/);
    assert.match(document, /https:\/\/www\.geonames\.org\//);
    assert.match(document, /https:\/\/creativecommons\.org\/licenses\/by\/4\.0\//);
    assert.match(document, /adapted/);
  }
});

test("central Impressum is bilingual and contains only verified business facts", () => {
  assert.match(impressum, /https:\/\/alpineart\.de\/unsolo\/legal\/impressum\.html/);
  assert.match(impressum, /Angaben gemäß § 5 DDG/);
  assert.match(impressum, /Information under Section 5 DDG/);
  assert.match(impressum, /Einzelunternehmen/);
  assert.match(impressum, /Sole proprietorship/);
  assert.match(impressum, /Daria Fokina/);
  assert.match(impressum, /Veilchenweg 16/);
  assert.match(impressum, /88046 Friedrichshafen/);
  assert.match(impressum, /unsolo\.box@gmail\.com/);
  assert.match(impressum, /https:\/\/t\.me\/unsolo_go/);
  assert.match(impressum, /@unsolo_go/);
  assert.doesNotMatch(impressum, /Handelsregister|register number|USt|VAT|tax ID|odr|online dispute/i);
});

test("publish copy preserves the click-to-load and reversible consent model", () => {
  assert.match(publishCopy, /Google Maps is off/);
  assert.match(publishCopy, /Load Google Maps/);
  assert.match(publishCopy, /Turn off Google Maps/);
  assert.match(publishCopy, /Your saved choice was removed/);
  assert.match(publishCopy, /\/unsolo\/legal\/plan-map-privacy\.html/);
  assert.match(publishCopy, /Email me when UnSolo launches\./);
  assert.match(publishCopy, /send me one launch notification/);
  assert.match(publishCopy, /My email will not appear on the map/);
  assert.match(publishCopy, /consent control starts unselected/);
  assert.match(publishCopy, /Plan can be published without email/);
});

test("new Plan Map legal texts contain no obsolete architecture claims", () => {
  const combined = privacy + publishCopy;
  assert.doesNotMatch(combined, /Google Forms?|Google Sheets?|manual prelaunch matching|public email|production UnSolo backend/i);
  assert.doesNotMatch(combined, /never logs|no logs|cannot log/i);
});

test("release pack records owner approval with the unresolved provider risk", async () => {
  const amendment = await readFile(new URL("legal/PLAN_MAP_RETENTION_AMENDMENT_2026-09-10.md", repo), "utf8");
  const notes = await readFile(new URL("legal/PLAN_MAP_LEGAL_REVIEW_NOTES.md", repo), "utf8");
  for (const document of [publishCopy, amendment, notes]) {
    assert.match(document, /WAITING FOR PROVIDER RESPONSE/);
    assert.match(document, /SU-470508/);
    assert.match(document, /DOCUMENTED RESIDUAL COMPLIANCE\s+RISK/);
    assert.match(document, /not a publication\s+blocker/);
  }
  assert.match(notes, /Daria Fokina, as controller\/owner/);
  assert.match(notes, /do not by\s+themselves establish compliance/);
  assert.match(notes, /using a new notice version after publication/);
  assert.doesNotMatch(privacy + publishCopy + amendment,
    /publication remains blocked|only remaining legal publication gate|legal pack remains unpublished while/i);
  assert.match(amendment, /30 days after `inactive_since`/);
  assert.doesNotMatch(amendment, /backend implementation NOT|backend still retains|deployed 12-month/i);
});

test("both notice languages disclose backup uncertainty without claiming a known deletion criterion", () => {
  const en = privacy.split("<h3>Exports, backups and provider recovery systems</h3>")[1]
    .split("<h2>7.")[0].replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
  const de = privacy.split("<h3>Exporte, Backups und Wiederherstellungssysteme des Anbieters</h3>")[1]
    .split("<h2>7.")[0].replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
  for (const text of [en, de]) {
    assert.match(text, /Supabase Pte\. Ltd\./);
    assert.match(text, /PITR/);
    assert.match(text, /SU-470508/);
  }
  assert.match(en, /We maintain no manual exports or separate backups of Plan or email\/contact data/);
  assert.match(en, /Customer-facing project backups are not enabled or included/);
  assert.match(en, /\(PITR\) is not enabled/);
  assert.match(en, /Residual data may remain temporarily/);
  assert.match(en, /We have not verified which such copies, if any/);
  assert.match(en, /does not publish a specific per-row internal-recovery retention duration in the documentation available to us/);
  assert.match(en, /cannot state a verified maximum duration or the precise deletion criterion/);
  assert.match(en, /one-day retention of our Free-project API\/database logs does not establish the retention period for recovery copies/);
  assert.match(en, /we will promptly update this notice/);
  assert.match(de, /keine manuellen Exporte oder gesonderten Backups/);
  assert.match(de, /weder aktiviert noch enthalten/);
  assert.match(de, /\(PITR\) ist nicht aktiviert/);
  assert.match(de, /Restdaten können vorübergehend/);
  assert.match(de, /Wir haben nicht verifiziert/);
  assert.match(de, /weder eine verifizierte Höchstdauer noch das genaue Löschkriterium/);
  assert.match(de, /aktualisieren wir diese Hinweise unverzüglich/);
  assert.match(privacy, /https:\/\/supabase\.com\/docs\/guides\/platform\/backups/);
  assert.match(privacy, /https:\/\/supabase\.com\/legal\/customer-resources\/data-processing-addendum/);
});

test("legal pages load no third-party resources by themselves", () => {
  for (const html of [privacy, impressum]) {
    assert.doesNotMatch(html, /<(?:script|iframe|img|link)[^>]+(?:google|supabase|github|geonames|creativecommons)/i);
    assert.doesNotMatch(html, /rel=["'](?:preconnect|dns-prefetch|preload)["']/i);
  }
});
