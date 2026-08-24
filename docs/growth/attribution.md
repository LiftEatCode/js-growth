# Attribution

Canonical UTM contract remains **attribution-v1** (`src/lib/growth/utm.ts`).

Lead Conversion Intelligence V1 classifies first-party audit UTMs into:

FACEBOOK · ORGANIC_SEARCH · ORGANIC_SOCIAL · DIRECT · REFERRAL · GBP · PAID · OUTBOUND · UNKNOWN

## Strength

| Label | Meaning |
|---|---|
| DIRECT_FIRST_PARTY | UTM source+medium on public audit, or known outbound provenance |
| STRONG | Partial first-party UTM on linked audit |
| DIRECTIONAL | Audit linked, weak/no UTM |
| INFERRED | Inbound lead without usable audit UTM |
| UNKNOWN | Do not force a channel |

## Touches

GA4 may model First user / Session source. JS first-party storage does **not**. Preserve the single captured tab-session bundle. Do not invent FIRST_TOUCH / LATEST_TOUCH history.

See [lead-conversion-intelligence.md](lead-conversion-intelligence.md) and [utm-conventions.md](utm-conventions.md).
