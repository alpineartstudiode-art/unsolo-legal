# Plan Map final legal/privacy review — 10 September 2026

**Current status — 11 September 2026:** the 30-day inactive-Plan policy is
deployed and live-verified; the unchanged three-year minimal evidence period is
approved. The sole remaining legal publication gate is Supabase
internal/recovery-copy behavior after deletion of individual rows:
**WAITING FOR PROVIDER RESPONSE**.

[Exact master-spec/addendum wording and owner-prepared Supabase inquiry](PLAN_MAP_RETENTION_AMENDMENT_2026-09-10.md).

The earlier review/follow-up sections below are dated history. Their statements
that the purpose or 30-day policy awaits owner approval are superseded by this
entry. Unrelated topics are not reopened.

| Item | Publication review |
| --- | --- |
| Privacy Notice | **RC READY; PUBLICATION GATED** — deployed 30-day behavior is aligned; provider-copy deletion remains unverified |
| Impressum contact requirement | **PASS on confirmed operating facts (legal assessment)** — email plus actively monitored direct Telegram contact; see follow-up limits below |
| GeoNames attribution | **PASS** — source, CC BY 4.0 link and adaptation indication present |
| Maps consent/revoke and publish copy | **PASS** — click, US disclosure, notice link, local choice and withdrawal are integrated in the RC |

## Evidence boundary

Reviewed all four requested legal files in `/tmp/unsolo-frontend-pages` and the
frozen master in the project's `output/`, especially sections 12.2 and 13.
The two named Implementation Decisions addendum files were not found in the
available project/worktree references. Their relevant owner-confirmed decisions
in the conversation were used: separate backend, operational/network metadata
accepted, backend completion. This is not a claim to have read unavailable originals.

Checked the frontend consent/revoke implementation and these backend references
in the original `unsolo-legal` checkout:

- `supabase/migrations/202609080001_search_destinations.sql`
- `supabase/migrations/202609080002_submit_plan.sql`
- `supabase/migrations/202609090002_plan_map_cleanup.sql`
- `supabase/migrations/202609090003_plan_map_cleanup_schedule.sql`
- `supabase/CLEANUP_LIFECYCLE_RUNBOOK.md` and saved verification reports

Final hosted PASS, absence of private payloads in inspected logs and one-day
Free-project retention are **owner-confirmed deployment findings**. Some saved
reports still end at “hosted review required”; they do not independently prove
the later log verdict. No remote queries or new traffic were generated here.
Provider publications below are documentation, not an account audit. Legal
conclusions and unresolved facts are identified separately.

## Legal bases

- **Plan publication:** Article 6(1)(b) can support necessary delivery of this
  free service under a valid service agreement. It is not automatically
  available for every visitor. The corrected draft separates page/feed/search
  delivery under 6(1)(f). Establish the Plan Map service relationship before real
  submissions; a notice or mobile-app-only agreement does not establish it by
  itself. No additional checkbox or paid contract is prescribed here.
- **Abuse and operational logs:** 6(1)(f), proportionate security, availability
  and troubleshooting. Accepted platform IP fields do not violate the approved
  application/business-storage boundary. Pseudonymous data remains protected.
- **Launch email:** 6(1)(a), plus prior express consent for electronic marketing
  under §7(2) no. 2 UWG. The separate optional, unselected, one-notification
  purpose fits. The exact approved consent text remains unchanged.
- **Maps:** 6(1)(a), with §25(1) TDDDG for consented terminal storage/access.
  A strictly necessary first-party preference can separately fall under
  §25(2) no. 2; that does not authorize early Google loading. No new CMP needed.
- **Consent evidence:** accountability requires proof but not a blanket
  three-year GDPR period. After processing ends, retain only what is necessary
  for an obligation or legal claims. The draft distinguishes this from initial
  proof under Articles 5(2)/7(1). Three years is deployed policy, not a statutory
  GDPR deadline or automatically the German limitation period.

**Necessity record resolved:** the owner selected the shorter 30-day inactive
Plan period for complaints, abuse/security investigations, data-integrity
incidents and questions about a previously published Plan. The three-year
email-free consent evidence remains limited to a later consent dispute and
cannot justify retaining plaintext email.

Sources: [GDPR Articles 5–7, 13, 17, 22](https://eur-lex.europa.eu/eli/reg/2016/679/ojv),
[EDPB 2/2019, paragraphs 25–33](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines-art_6-1-b-adopted_after_public_consultation_en.pdf),
[EDPB 05/2020, paragraphs 107–108](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf),
[§7 UWG](https://www.gesetze-im-internet.de/uwg_2004/__7.html),
[§25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html).

## Retention versus implementation — deployed baseline, not the newly approved policy

The frozen master explicitly defines thresholds followed by daily execution.
The deployed schedule is `0 2 * * *` (02:00 UTC daily).

| Data | Source behavior and corrected wording |
| --- | --- |
| Active Plan | Exact/month ends at the specified date/month; flexible is created +90×24h rounded up to Berlin midnight, no extra day at exact midnight. Public reads exclude expiry independently of cleanup. |
| Inactive Plan | `inactive_since + 30 days`, then the next daily cleanup run; normally up to another 24h. |
| Optional email | Operator withdrawal/erasure, Plan deletion, or collection +12 Berlin calendar months with daily cleanup. No use after withdrawal, purpose completion or expiry. Sending is not implemented here; the future sender must respect eligibility independently of cleanup lag. |
| Consent evidence | Email deletion +3 Berlin calendar years, then daily cleanup. Restricted reference/version/time/purpose fields; no email. May move to private ledger after Plan deletion. |
| Submit abuse events | Eligible at 48h, normally removed by 72h. Previous “up to 48 hours” claim was inaccurate. |
| Search windows | Eligible after 24h since last accepted activity, normally removed by 48h of inactivity; accepted activity refreshes that timestamp. |
| Idempotency key/fingerprint | Remain with the Plan, separate from short-lived abuse events. |
| Supabase API/database logs | One day for verified Free project, not universal provider/backup retention. |
| Map choice | Until revocation or clearing first-party site data. |

Normal timing assumes successful daily cleanup. Missed/locked/batched work is
caught up by the existing operator procedure. No unconditional 72h guarantee.

**Missing backup fact:** no project-specific backup availability, rotation,
manual-export or recovery-retention record was found. The notice cannot promise
complete erasure of every copy at the live-database threshold. The frozen master
requires this fact and accurate backup wording. Supabase documents paid-plan
backups and recommends Free exports; that does not prove this account has no
backup copies. Establish the actual arrangement, then describe only it. Do not
invent a 7/30-day retention or PITR. Recovery must not republish erased data.

Sources: [Supabase pricing](https://supabase.com/pricing),
[Supabase backups](https://supabase.com/docs/guides/platform/backups).

## Providers, transfers and logging

The corrected EN/DE wording describes Singapore/US processing and links
safeguards instead of implying that Frankfurt means all processing is EU-only.

- **Supabase:** its current DPA identifies Supabase Pte. Ltd., forms part of the
  customer agreement and incorporates SCC provisions for relevant transfers.
  A separate wet signature is not presumed necessary. Record which accepted
  agreement covers Daria's account and the applicable subprocessors; a public
  DPA is not an account inspection.
- **GitHub Pages:** provider documentation explicitly says visitor IPs are
  logged for security. Its privacy statement describes international processing
  and SCC/DPF mechanisms. GitHub retention is not Supabase's one-day period.
- **Google Maps:** optional loading can involve Google LLC/US processing;
  Google describes DPF and SCC safeguards. Maps consent is not a substitute
  for transfer safeguards or a routine Article 49 derogation. No assertion
  that all entities/transfers are DPF-covered was added.

Account-specific contractual coverage/recipient mapping was not supplied by
the earlier legal pack either. Confirm it before an unconditional transfer
compliance claim. This is a documentary gap, not proof that safeguards are
absent or infrastructure must change.

Supabase documents Invocation request/response bodies. Such bodies/private
values were **not observed** in the owner-confirmed reviewed logs; body capture
was **not proven disabled**. Both statements now appear in the notice.
Operational IP metadata is covered by the approved decision, not a new blocker.

Sources: [Supabase DPA, clauses 2, 6, 12](https://supabase.com/legal/customer-resources/data-processing-addendum),
[Supabase Invocation logging](https://supabase.com/docs/guides/functions/logging),
[GitHub Pages IP logging](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages),
[GitHub privacy/transfers](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement),
[Google privacy](https://policies.google.com/privacy),
[Google transfer frameworks](https://policies.google.com/privacy/frameworks).

## Impressum: initial finding, superseded for contact by follow-up below

Approved controller identity, Einzelunternehmen, postal address and email are
retained unchanged. Under §5(1) no. 2 DDG read with CJEU C-298/07 paragraph 40,
email needs additional information enabling rapid, direct, effective contact.
A phone is not mandatory as such: a functioning promptly answered enquiry form
can qualify, with a non-electronic alternative in the situation described by
the judgment. Postal address plus email alone is not established as sufficient
here. Einzelunternehmen is not an exemption.

The earlier `output/UnSolo_Legal_Pack_2026-09-06/impressum.md` already records
this as unresolved F01. Supply an approved public phone or verified existing
alternative; no contact service is being built in this task.

Confirm whether an USt-IdNr., W-IdNr. or relevant register entry exists. §5(1)
nos. 4/6 require applicable particulars, not the personal Steuernummer.
“Kleingewerbe” does not prove absence. No number, tax status, regulator or
arbitration commitment was fabricated. §36 VSBG's small-employer exception
concerns no. 1, not a participation obligation/commitment under no. 2; omission
must reflect the actual facts. No obsolete ODR link was inserted.

Sources: [§5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html),
[CJEU C-298/07](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:62007CJ0298),
[§36 VSBG](https://www.gesetze-im-internet.de/vsbg/__36.html).

## Attribution/copy and scope checks

The exact approved GeoNames line is preserved with source/license links and
“adapted”. The dump README specifies CC BY 4.0. No stale Forms/Sheets, manual
matching, public contact field or mobile-production-backend claim remains.
The only Google Places reference explicitly says it is not used. Both legal
HTML pages load no third-party resources. Maps withdrawal removes the local
choice/reloads; it cannot undo prior Google processing.

Sources: [GeoNames dump README](https://download.geonames.org/export/dump/readme.txt),
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode.en).

Public copying/reidentification risk is now disclosed in both languages.
Automated abuse rejection is described instead of claiming no automated
processing/decisions at all. Consent/revoke copy now explicitly mentions the
US and ability to turn Maps off. No change to the approved email-consent text.

## Local changes and verification

Changed only Privacy Notice, publish-copy Markdown and these notes.
Impressum inspected, unchanged pending genuine facts. No frontend/UI/backend,
schedule, secrets, evidence records or deployment changed.

Version IDs were not rotated. Edits remain unpublished review candidates, not
replacement text for notices already issued under immutable IDs. Preserve the
old text in history; if presented to real users, obtain approval for a new
notice ID before release, without rewriting historical evidence. Synthetic
backend tests alone are not evidence of real-user notice delivery.

Existing legal-pack tests: **8 PASS / 0 FAIL**. They verify content strings and
resource boundaries, not legal sufficiency. The Impressum test passes despite
the missing extra contact. No test was changed or weakened.

```sh
/Users/dariafokina/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/plan_map_legal_pack.test.mjs
```

The initial review recorded contact/conditional business facts, backup coverage,
account safeguards and the purpose/basis record. The owner has narrowed this
follow-up to contact reassessment and the two retention/backup questions below;
unrelated earlier findings are not re-investigated or silently certified here.
Integration of canonical legal links, attribution and approved copy into the
reviewed UI is a separate release step, not performed here.


## Focused follow-up — 10 September 2026

### Direct contact: updated

Owner confirmed `@unsolo_go` is a dedicated UnSolo account, actively monitored,
with direct access to the controller. Added a plain `https://t.me/unsolo_go`
link to both languages of Impressum; email and postal address remain present.
No Telegram widget/script, message, or automatic resource loading was added.
No guarantee of a numerical response time was invented.

**Assessment:** on these confirmed operating facts, email plus this rapid,
direct messaging route meets the functional contact requirement in §5(1)
no. 2 DDG for this review. This is an application of the rule, not a judgment
specifically approving Telegram. C-298/07 does not require a telephone as such.
Telegram messaging requires access to Telegram; the general email remains
available to everyone, and effective non-electronic communication must be
provided on request in the exceptional loss-of-network situation addressed
by that judgment. Do not describe Telegram as an account-free web contact form.
We did not send a test message; actual monitoring/direct availability is the
owner's explicit confirmation. No unrelated business particulars were changed.

### Backup/export facts now established

Read-only authenticated Dashboard inspection at approximately
2026-09-10 10:56 UTC, solely for `unsolo-plan-map`, reference
`zgzmixewdrzhwduvhkau`, organization UnSolo Plan Map / Free:

- [Scheduled backups](https://supabase.com/dashboard/project/zgzmixewdrzhwduvhkau/database/backups/scheduled)
  displayed: “Free Plan does not include project backups.” The upgrade offer
  refers to Pro scheduled backups, not an enabled retention setting.
- [Point in time](https://supabase.com/dashboard/project/zgzmixewdrzhwduvhkau/database/backups/pitr)
  displayed: “Point in Time Recovery is a Pro Plan add-on”. No enabled PITR.
- No upgrade, restore, export, SQL, schedule or other write was performed.
  These observations prove product availability/configuration, not the physical
  absence of every infrastructure copy. The existing preview and SQL tab were
  not changed.

Owner additionally confirmed: no real-user Plans/contacts currently exist;
synthetic rows were removed; no manual exports, CSV lists, local backups,
spreadsheets or other Plan/contact copies are maintained outside controlled
verification. GitHub holds source/test/evidence material, with no intentional
real-user Plan/contact storage. This is an owner-confirmed fact, not a full
forensic search of every computer or cloud account.

The existing cleanup operator implements real DELETE for expired retention
Plans, email nulling followed by limited evidence cleanup, and removal of its
synthetic rows. It does not demonstrate secure physical wiping of PostgreSQL
pages, WAL or provider disaster-recovery media. The one-day API/database log
period cannot be substituted for that missing provider fact.

**Remaining provider question:** current Supabase DPA Schedule 1 says backups
are taken by default, whereas this project's Free Dashboard excludes the
customer backup feature. DPA clause 11.2's 30-day period concerns agreement
expiry; it does NOT establish a 30-day purge deadline after deleting a Plan
from a still-running project. No internal-copy rotation limit for this case
was established by the available primary documentation. This is an unresolved
provider fact, not a demonstrated privacy violation or reason to buy an upgrade.

Exact question for Supabase support/privacy (prepared only, not sent):

> For our Free project zgzmixewdrzhwduvhkau in eu-central-1, Dashboard shows no
> scheduled project backups or PITR. Does Supabase nevertheless retain database
> snapshots, WAL archives, recovery copies or other provider-managed copies
> containing rows deleted from the live database? If yes, what retention/rotation
> deadline or criterion applies after an ordinary row deletion while the project
> remains active, and how are deleted rows prevented from returning after a
> provider restore? If no such persistent copies exist, please confirm. We need
> to distinguish this from the one-day API/database log retention and the DPA's
> agreement-termination deletion clause.

Primary evidence: [backup documentation](https://supabase.com/docs/guides/platform/backups),
[DPA clause 11.2 and Schedule 1](https://supabase.com/legal/customer-resources/data-processing-addendum).

### Inactive Plans: approved minimal period

Owner purpose is limited to complaints, abuse/security investigations,
data-integrity incidents and possible disputes about a previously published
Plan. Advertising, profiling, matching, training and marketing analytics are
explicitly excluded. The owner chose the shorter 30-day period as the
proportionate default for this disposable pre-launch V1.

No longer period is justified by a live complaint history, delayed-investigation
pattern, seasonal dependency, annual audit requirement, or statutory rule. The
separate short-lived abuse controls do not need a longer Plan archive to enforce
their rolling limits.

**Approved and deployed for this disposable pre-launch V1: 30 days from
inactive_since as the deletion threshold, with the existing daily execution delay
normally adding at most another 24 hours.** This is a conservative operational
policy recommendation for timely complaints and incident diagnosis, not a
statutory minimum or proof that exactly 30 days is uniquely necessary. Earlier
valid erasure requests still apply. If even that buffer has no operational
use, deletion on the next cleanup after expiry is the more minimal option.

A concrete open complaint/legal claim may justify preserving the specific
necessary evidence until resolution; it does not justify silently retaining
all Plans for a year. No new legal-hold table, case-management system, restore
feature or automatic exception is proposed/implemented in this task. Any actual
case retention must be specifically assessed before departing from the approved
routine deletion policy.

The narrow migration and live verification are complete. The policy is grounded
in GDPR Articles 5(1)(c)/(e), 6(1)(f), and 17; there is no legally mandated
numerical shortest period for this V1.

### Minimal consent evidence: three-year ceiling is defensible

Confirmed purpose: demonstrate the consent transaction if the one launch
notification is later disputed. The existing restricted fields record Plan
reference, consent/notice versions, consent time, purpose and deletion/retention
times; they do not retain plaintext email or a recipient hash in the ledger.
Keeping this limited evidence separately from the email is a proportionate way
to preserve an audit trail while removing the communication address.

**Assessment:** retain the existing three-calendar-year ceiling after email
deletion for this narrow evidentiary/claims purpose, with restricted access,
no reuse for notification or analytics and review of any demonstrably unnecessary
evidence. The balance is materially different from archiving full travel Plans:
far fewer fields remain, no contact address, but a future consent dispute can
still require the contemporaneous text/version/time record. This is a defensible
risk-based policy ceiling, not a guarantee that every record must be kept for
all three years.

While consent-based processing continues, Articles 5(2)/7(1) support the proof
obligation; subsequent necessary claims retention is assessed under 6(1)(f),
with 17(3)(e) relevant to erasure exceptions (not an independent legal basis).
EDPB 05/2020 paragraphs 106–108 require sufficient linkage without excessive
additional data. The minimal ledger can corroborate a specific transaction;
it does not, alone, prove ownership of a since-deleted email address. That
limitation does not justify retaining plaintext email merely to improve evidence.

BGB §195's usual three years and §199's year-end/knowledge-based start are NOT
the implemented clock. Do not claim that email_deleted_at +3 years covers every
possible legal limitation period or that the GDPR mandates that duration.
No retention extension, new recipient identifier or architecture change is needed
for the recommended limited policy.

Sources: [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/ojv),
[EDPB 05/2020 paragraphs 106–108](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf),
[§195 BGB](https://www.gesetze-im-internet.de/bgb/__195.html),
[§199 BGB](https://www.gesetze-im-internet.de/bgb/__199.html).

### Follow-up scope and disposition

Only Impressum and these review notes changed in this follow-up. Privacy
Notice, publish copy, frontend, backend and deployment remained untouched.
The contact omission is resolved on the stated operating facts. Manual-export
facts are resolved by owner confirmation, customer backup/PITR configuration
by direct Dashboard observation. Internal-copy deletion needs the specific
provider answer above. The approved inactive-Plan policy is deployed; the
three-year minimal-evidence policy is supportable as qualified above. No other
component or legal topic was reopened.


## Owner decision recorded — 30-day policy deployed

The owner approved 30 days after a Plan becomes inactive, followed by the next
daily cleanup run. Limited purpose: user complaints, abuse/security
investigations, data-integrity incidents and questions about a previously
published Plan. No blanket extension for hypothetical legal disputes. Actual
record-specific disputes/obligations require their own applicable legal basis;
no new automatic cleanup exception is authorized.

The three-year minimal consent-evidence period remains unchanged and does not
justify keeping plaintext email. The earlier questions about purpose and owner
approval are resolved. The only outstanding provider fact is internal/recovery
copy retention and erasure after individual row deletion in an active Free
project. Use the owner's exact inquiry in the linked amendment; it has not been
sent by the assistant.

The local Privacy Notice now contains the approved 30-day rule and purpose in
both languages and clearly scoped consent-evidence wording. Its source comment,
publish-copy release gate and this record prohibit publication before resolution
of the provider-copy question. The email's independent
12-month maximum remains unchanged; earlier deletion of its Plan can end email
retention sooner under the existing rules.

The release candidate changes the Privacy Notice, publish copy, these review
notes, the amendment record, and their frontend links/copy. It does not change
backend migrations, live settings, or the frozen master and does not rotate
legal IDs or rewrite historical consent evidence.
