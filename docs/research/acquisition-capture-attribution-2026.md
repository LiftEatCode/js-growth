# Acquisition Capture & Attribution Research — 2026

**Research date:** 2026-08-24  
**Access date:** 2026-08-24  
**Purpose:** Ground Growth Sprint 10 (Acquisition Capture V1) in official GA4 traffic-source guidance while keeping first-party commercial conversion attribution separate.

Layers: **OFFICIAL** · **FIRST_PARTY_FACT** · **INFERENCE** · **HYPOTHESIS** · **JS_SOLUTIONS_OPERATING_RULE**

---

## OFFICIAL

### 1. Manual UTM tagging

| Field | Value |
|---|---|
| **SOURCE** | Google Analytics Help — Traffic-source dimensions, manual tagging, and auto-tagging |
| **URL** | https://support.google.com/analytics/answer/11242870 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Manual UTMs populate source/medium/campaign (and related) dimensions at first-user, session, and event scopes. Incomplete UTMs can yield `(not set)`. |
| **IMPLICATION** | Operator-tagged Facebook/GBP links remain required for strong first-party joins. |
| **JS SOLUTIONS DECISION** | Reuse attribution-v1 / UTM presets. Do not invent competing UTM conventions. |

### 2. URL builders / campaign parameters

| Field | Value |
|---|---|
| **SOURCE** | Google Analytics Help — URL builders |
| **URL** | https://support.google.com/analytics/answer/10917952 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Campaign URLs should include `utm_source`, `utm_medium`, and `utm_campaign` at minimum. |
| **IMPLICATION** | UTM builder presets must always set those three. |
| **JS SOLUTIONS DECISION** | Facebook company/founder + GBP website/post presets enforce the triad. |

### 3. Traffic-source dimensions

| Field | Value |
|---|---|
| **SOURCE** | Google Analytics Help — About traffic-source dimensions |
| **URL** | https://support.google.com/analytics/answer/15612152 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Traffic-source dimensions power acquisition analysis; manual tagging and auto-tagging are both supported. |
| **IMPLICATION** | GA4 remains session/user acquisition authority. First-party DB remains conversion authority. |
| **JS SOLUTIONS DECISION** | Do not copy GA4 first-user/last-click models into commercial pipeline identity. |

---

## FIRST_PARTY_FACT

1. Pre-Sprint 10: sessionStorage stored UTMs only when present; most public audits had null `attributionJson` → UNKNOWN.
2. Contact form parsed UTMs for email only — NOT_CAPTURED in DB.
3. Existing Facebook company/founder UTM presets already exist.

---

## INFERENCE

Referrer host classification can provide DIRECTIONAL acquisition when UTMs are absent, but must never invent GBP from Google organic.

---

## HYPOTHESIS

Tagged Facebook/GBP journeys plus durable contact attribution will raise known-channel coverage for **new** conversions without rewriting historical UNKNOWN.

---

## JS_SOLUTIONS_OPERATING_RULE

1. First-observed browser context: localStorage, **90-day** TTL.
2. Current session: sessionStorage (survives internal navigation).
3. DIRECT counts as classified; UNKNOWN is unresolved; NOT_CAPTURED means instrumentation unavailable.
4. Attribution failure never blocks audit/contact success.
5. No historical backfill of the 14 UNKNOWN audits.
