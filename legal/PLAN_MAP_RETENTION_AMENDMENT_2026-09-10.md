# Owner-approved inactive-Plan retention amendment — 10 September 2026

Status on 11 September 2026: **approved, deployed, and live-verified** for the
separate Plan Map backend. This remains a narrow amendment, not a new
architecture. The only legal publication gate is Supabase internal/recovery-copy
behavior after row deletion: **WAITING FOR PROVIDER RESPONSE**.

The deployed rule is 30 days after `inactive_since`, followed by deletion on
the next daily cleanup run.

## Authoritative frozen-spec amendment

Source: `UnSolo_Plan_Map_Technical_Spec_v2.0_FROZEN.md`, section 12.2,
“Retention table”, Expired/hidden Plan row (line 468 in the reviewed copy).

The authoritative inactive-Plan row is:

```text
| Expired/hidden Plan | 30 дней после начала неактивности | Порог удаления: `inactive_since + 30 days`; удаление на следующем ежедневном cleanup run. Hide не продлевает уже начатый срок. |
```

Add immediately below the retention table:

> Поправка владельца от 10 сентября 2026: неактивные Plans сохраняются в течение
> 30 дней исключительно для обработки пользовательских жалоб, расследований
> злоупотреблений и инцидентов безопасности, инцидентов целостности данных и
> вопросов о ранее опубликованном Plan. После этого они удаляются на следующем
> ежедневном cleanup run. Нельзя продлевать хранение всех неактивных Plans лишь
> на случай гипотетического правового спора. Конкретная запись, необходимая для
> реального спора или исполнения правовой обязанности, может рассматриваться
> отдельно, только в необходимом объёме на применимом правовом основании.
> Настоящая поправка не вводит автоматическое исключение из cleanup или новую
> систему legal hold. Минимальное consent evidence сохраняется три года после
> удаления email только для подтверждения согласия на единственное launch
> notification при его оспаривании. Plaintext email не сохраняется только ради
> этого доказательства. Остальные lifecycle/retention правила не меняются.

Keep the Contact/email and Consent record rows unchanged. Keep section 12.1's
definition of `inactive_since` and the next-daily-run execution rule unchanged.
The symbolic `+ 30 days` is the policy threshold, not a SQL patch in this task.

## Exact addendum text

The named 8 September and 9 September Implementation Decisions files were not
available locally. Therefore no purported verbatim replacement of their
unseen text is provided. Append this dated superseding entry to the authoritative
backend-completion addendum; in the 8 September addendum add a cross-reference
only if it repeats the old inactive-Plan period. Preserve the historical decisions.

```text
10 September 2026 — Owner-approved inactive-Plan retention amendment

This entry supersedes only the former inactive-Plan period. Inactive Plans are
retained for 30 days after inactive_since and deleted
on the next daily cleanup run. The sole purposes during those 30 days are
handling user complaints, abuse/security investigations, data-integrity
incidents, and questions concerning a previously published Plan.

All inactive Plans must not be kept longer merely for a hypothetical legal
dispute. A specific record needed for an actual dispute or legal obligation may
be assessed separately under the applicable legal basis; this does not create
a blanket retention extension or authorize a new automatic cleanup exemption.

Minimal launch-consent evidence remains subject to deletion three years after
email deletion, followed by the existing daily cleanup. Its purpose is to
demonstrate that launch-notification consent was obtained if later disputed.
Plaintext email must not be retained solely for this evidence.

The backend implementation of this narrow amendment is deployed and verified.
The legal pack remains unpublished while the provider-copy fact is pending.
```

## Preserved implementation boundaries

- Only inactive-Plan retention eligibility and its associated checks, tests,
  and operator documentation changed. The optional email period is independent.
- The existing cleanup source is
  `supabase/migrations/202609090002_plan_map_cleanup.sql`. It includes both
  deletion selection and remaining-due checks for inactive Plans. Applied
  migration history remains immutable.
- Earlier Plan deletion also triggers the existing linked email/contact
  handling. The email's independent 12-month maximum is unchanged; the earlier
  applicable event still wins. Three-year evidence retention starts at actual
  email deletion and continues in the private ledger where required.
- Keep exact/month/flexible expiry, earliest inactivity timestamp, daily
  schedule, public visibility filter, RLS/grants, APIs, abuse retention and
  GeoNames unchanged. Do not retain old Plans or plaintext email just to keep
  evidence. Do not add a legal-hold mechanism without a separate concrete need.
- Verification covered just-before/at/after the 30-day threshold, next-run
  execution, earliest inactivity after hide/expiry, timezone boundaries,
  contact removal/evidence transfer, and unchanged three-year cleanup.

Approved immutable legal version mappings and historical consent evidence were
not rewritten by the implementation. No further backend change is part of this
release candidate.

## Sole remaining provider fact — owner-prepared inquiry

The current Free project has no customer-enabled scheduled backups or PITR.
Provider-internal copies and their deletion after an individual row deletion
remain unverified. The question is **WAITING FOR PROVIDER RESPONSE**; no answer
is inferred in this release candidate.

> We use a Supabase Free project in the EU (Frankfurt). Automatic project backups and PITR are not enabled.
>
> When an individual PostgreSQL row containing personal data is deleted from an active project, can that deleted row remain in any Supabase-managed internal backup, disaster-recovery, replica, snapshot, or other recovery copy that is not visible in the Dashboard?
>
> If yes:
>
> 1. what types of copies may contain it;
> 2. what is the maximum retention period before the deleted row is no longer recoverable from those copies;
> 3. whether deletion from those copies happens automatically;
> 4. whether customers can request earlier deletion from such copies;
> 5. whether this behavior is documented in your DPA or another current policy/document.
>
> We need the answer for GDPR transparency and retention documentation.
