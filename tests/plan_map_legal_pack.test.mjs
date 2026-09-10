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
    "12 Berlin calendar months",
    "zwölf Berliner Kalendermonate",
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

test("legal pages load no third-party resources by themselves", () => {
  for (const html of [privacy, impressum]) {
    assert.doesNotMatch(html, /<(?:script|iframe|img|link)[^>]+(?:google|supabase|github|geonames|creativecommons)/i);
    assert.doesNotMatch(html, /rel=["'](?:preconnect|dns-prefetch|preload)["']/i);
  }
});
