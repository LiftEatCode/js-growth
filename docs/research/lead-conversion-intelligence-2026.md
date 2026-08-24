# Lead Conversion Intelligence Research — 2026

**Research date:** 2026-08-24  
**Access date:** 2026-08-24  
**Purpose:** Ground Growth Sprint 9 (Lead Conversion Intelligence V1) in official GA4 attribution guidance while keeping first-party commercial data authoritative for pipeline.

Layers: **OFFICIAL** · **INFERENCE** · **HYPOTHESIS**

---

## OFFICIAL GUIDANCE

### 1. Campaign / traffic-source scopes

| Field | Value |
|---|---|
| **SOURCE** | Google Analytics Help — Campaigns and traffic sources |
| **URL** | https://support.google.com/analytics/answer/11242841 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | GA4 exposes traffic-source dimensions at user, session, and event scopes (e.g. First user source, Session source, Source). Attribution assigns credit for key events using configured models and lookback windows. |
| **IMPLICATION** | Browser analytics can describe acquisition of sessions/key events; it is not the authority for Prospect/Opportunity/Client identity. |
| **JS SOLUTIONS DECISION** | Prefer GA4 for session/user acquisition. Prefer first-party DB for pipeline. Do not invent multi-touch journeys in first-party storage. |

### 2. Manual UTM tagging

| Field | Value |
|---|---|
| **SOURCE** | Google Analytics Help — Traffic-source dimensions, manual tagging, and auto-tagging |
| **URL** | https://support.google.com/analytics/answer/11242870 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Manual UTMs (`utm_source`, `utm_medium`, `utm_campaign`, etc.) populate traffic-source dimensions. Incomplete UTM sets can yield `(not set)`. Auto-tagging is for ad-platform integrations. |
| **IMPLICATION** | Organic Facebook/Search/GBP work depends on consistent UTM conventions already defined in `attribution-v1`. |
| **JS SOLUTIONS DECISION** | Reuse existing UTM taxonomy. No competing UTM definitions in Sprint 9. |

### 3. About traffic-source dimensions

| Field | Value |
|---|---|
| **SOURCE** | Google Analytics Help — About traffic-source dimensions |
| **URL** | https://support.google.com/analytics/answer/15612152 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Traffic-source dimensions are the building blocks for attribution and acquisition analysis; they can be populated via manual tagging or auto-tagging. |
| **IMPLICATION** | Channel summaries should map from observed source/medium, not from guessed referrer strings. |
| **JS SOLUTIONS DECISION** | Channel taxonomy maps known UTM pairs → FACEBOOK / ORGANIC_SEARCH / GBP / DIRECT / REFERRAL / UNKNOWN. Unknown stays explicit. |

### 4. Key events vs commercial pipeline

| Field | Value |
|---|---|
| **SOURCE** | Google Analytics Help — Campaigns and traffic sources (attribution / key events) |
| **URL** | https://support.google.com/analytics/answer/11242841 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Attribution in Analytics assigns credit for **key events**. Lookback windows and models affect which touchpoints receive credit. |
| **IMPLICATION** | `audit_submitted` / `contact_form_submitted` may be key-event candidates, but Opportunity/Agreement/Payment are commercial DB facts. |
| **JS SOLUTIONS DECISION** | Do not use GA4 key-event counts as Opportunity/Client counts. Commercial models remain authoritative. |

---

## INFERENCE

1. First-party `CampaignAttribution` (sessionStorage, first UTM in tab) is a **session capture**, not GA4 First user / Last click modeling.
2. Incomplete contact-form attribution storage means many inbound contacts remain **UNKNOWN** in DB even if GA4 saw a session.
3. Mixing outbound `Prospect` creates with inbound `Lead` creates would invent a false “marketing leads” total.

---

## HYPOTHESIS

1. Once `/seo` and Facebook UTMs accumulate attributed audits that become Leads/Opportunities, channel sample sizes may eventually reach EARLY_DIRECTIONAL — not yet assumed.
2. A future first-party Lead.attributionJson (or report→lead handoff copy) would strengthen DIRECT_FIRST_PARTY joins without sending PII to GA4.

---

## JS SOLUTIONS DECISIONS (Sprint 9)

1. `LEAD_CONVERSION_INTELLIGENCE_VERSION = 1` — derived observation layer only.
2. Commercial authority unchanged; growth reads aggregates + attention links.
3. Inbound (`Lead` + public `AuditReport`) vs outbound (`Prospect`) always separated.
4. ROI_NOT_AVAILABLE when marketing cost is not represented.
5. No OpenAI / Meta / GSC / Places / Crawl / Resend / Stripe mutations on dashboard load.
6. No vanity “Growth Score.”
