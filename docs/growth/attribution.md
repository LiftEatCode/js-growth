# Attribution

Canonical UTM contract remains **attribution-v1** (`src/lib/growth/utm.ts`).  
Acquisition Capture V1 (`ACQUISITION_CAPTURE_VERSION = 1`) extends that contract for **new** journeys — it does not create attribution-v2.

## Scopes (JS Solutions names)

| Scope | Storage | Behavior |
|---|---|---|
| First observed | `localStorage` `jsg-growth-first-observed-v1` | Earliest legitimate context in a **90-day** TTL. Never overwritten by internal navigation. |
| Current session | `sessionStorage` `jsg-growth-attribution-v1` | Survives internal nav. Updates on new external/campaign UTM entry. |
| Conversion | `AuditReport.attributionJson` / `ContactSubmission.attributionJson` | Server-normalized snapshot at submit. |

Cross-device: **NOT_MODELED**. Do not call these GA4 first-user / last-click unless semantics match.

## Channel classifier

FACEBOOK · ORGANIC_SEARCH · ORGANIC_SOCIAL · DIRECT · REFERRAL · GBP · PAID · OUTBOUND · UNKNOWN

### Precedence

1. Explicit valid UTM  
2. Known campaign / referrer inference (host class only)  
3. Direct (no campaign/referrer evidence)  
4. Unknown  

Google organic referrer ≠ GBP. GBP requires `google_business_profile` / `organic_local` evidence.

### Strength

| Label | Meaning |
|---|---|
| DIRECT_FIRST_PARTY | Full UTM entry, or observed DIRECT |
| STRONG | Partial UTM |
| DIRECTIONAL | Referrer inference only |
| INFERRED | Inbound without usable UTM (legacy path) |
| UNKNOWN | No usable evidence |

## Coverage

- **KNOWN_CHANNEL** — FACEBOOK, SEARCH, GBP, REFERRAL, PAID, etc.  
- **DIRECT** — classified/known (not a catch-all for broken tracking)  
- **UNKNOWN** — unresolved  
- **NOT_CAPTURED** — instrumentation unavailable  

`knownRate` = (knownChannel + direct) / eligible.

## Historical safety

Do **not** backfill the existing UNKNOWN public audits. Null `attributionJson` stays UNKNOWN. Legacy objects without UTMs keep Sprint 9 DIRECT classification.

## Contact

Contact forms persist `ContactSubmission` (PII in row; attribution JSON has no PII). Contact does **not** auto-create `Lead`.

See [lead-conversion-intelligence.md](lead-conversion-intelligence.md), [utm-conventions.md](utm-conventions.md), and [../research/acquisition-capture-attribution-2026.md](../research/acquisition-capture-attribution-2026.md).
