# Plan Map legal review notes

Prepared locally on September 10, 2026. Nothing in this legal pack has been
deployed.

## Verified implementation facts reflected

- The Plan Map is a separate public web page hosted through GitHub Pages.
- Its backend is the separate Supabase project in the EU Frankfurt region.
- Google Maps is click-to-load. Verified browser tests showed zero Google
  requests before consent. Revocation removes the first-party choice and reloads.
- Destination search uses the locally imported GeoNames snapshot. It does not
  call Google Places or GeoNames at runtime.
- Public Plans expose only the verified public projection. Email and contact
  evidence remain private.
- Plan Map business storage contains keyed identifiers rather than raw IP.
  Hosted infrastructure logs may contain IP and connection metadata.
- Hosted log reviews did not observe request or response bodies, destination
  queries, or submitted Plan/contact values.
- The verified Free-project API and database log retention is one day.
- Exact, month, and flexible Plan expiry remains database-calculated.
- Expired or hidden Plans are deleted after 12 Berlin calendar months.
- Optional email is removed on the earliest applicable event: withdrawal or
  erasure, Plan deletion, or 12 Berlin calendar months after collection.
- Minimal consent evidence without email is removed three Berlin calendar years
  after email deletion.
- Abuse events have a 48-hour retention boundary; search windows use 24 hours.

## Questions for final legal review

These are legal characterization questions, not missing implementation facts:

1. Confirm Article 6(1)(b) GDPR as the basis for destination search, voluntary
   Plan submission, and publication in this free service.
2. Confirm Article 6(1)(c), read with Articles 5(2) and 7(1), as the basis for
   retaining the minimal consent evidence for three years.
3. Confirm the provider and international-transfer wording for GitHub Pages,
   Supabase and Google Maps against the controller's current account agreements.
4. Confirm that the supplied email address provides the required direct contact
   route for this sole proprietorship under Section 5 DDG. No telephone number
   was provided or invented.

No register number, VAT/tax identifier, professional chamber, supervisory
authority, or consumer-arbitration participation statement was added because
none was verified. The former EU ODR platform link was omitted because
Regulation (EU) 2024/3228 repealed Regulation (EU) 524/2013 with effect from
July 20, 2025.

## Primary references checked

- GDPR, including Articles 5, 6, 7 and 13:
  https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Section 25 TDDDG:
  https://www.gesetze-im-internet.de/ttdsg/__25.html
- Section 5 DDG:
  https://www.gesetze-im-internet.de/ddg/__5.html
- Regulation (EU) 2024/3228:
  https://eur-lex.europa.eu/eli/reg/2024/3228/oj
- GeoNames data terms:
  https://www.geonames.org/export/
- Creative Commons Attribution 4.0:
  https://creativecommons.org/licenses/by/4.0/
- Supabase logs:
  https://supabase.com/docs/guides/observability/logs
- Supabase Free plan log retention:
  https://supabase.com/pricing
- Supabase DPA:
  https://supabase.com/legal/customer-resources/data-processing-addendum
- Google Privacy Policy:
  https://policies.google.com/privacy
- Google Maps Platform Terms:
  https://cloud.google.com/maps-platform/terms
