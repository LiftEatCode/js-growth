# Lead Follow-up & Nurture Operations Research — 2026

**Research date:** 2026-08-24  
**Access date:** 2026-08-24  
**Purpose:** Ground Growth Sprint 11 (Lead Follow-up & Nurture Operations V1) in first-party CRM/email platform mechanics while keeping JS Solutions human-controlled, no-auto-send posture.

Layers: **OFFICIAL** · **FIRST_PARTY_FACT** · **INFERENCE** · **HYPOTHESIS** · **JS_SOLUTIONS_OPERATING_RULE**

---

## OFFICIAL

### 1. HubSpot — record activity timeline

| Field | Value |
|---|---|
| **SOURCE** | HubSpot Knowledge Base — Understand and use the record page layout |
| **URL** | https://knowledge.hubspot.com/records/work-with-records |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | CRM records expose a chronological Activities tab (calls, emails, meetings, tasks, notes, form submissions). Upcoming activities appear at the top; operators filter by type, owner, and date. |
| **IMPLICATION** | Durable activity history on the commercial record is standard CRM practice; it is separate from marketing acquisition analytics. |
| **JS SOLUTIONS DECISION** | `FollowUpActivity` is append-only commercial history on Lead / Prospect / Opportunity — not a GrowthSnapshot field. |

### 2. HubSpot — lead response measurement

| Field | Value |
|---|---|
| **SOURCE** | HubSpot Community — Lead Response Time Reporting |
| **URL** | https://community.hubspot.com/t5/Reporting-Analytics/Lead-Response-Time-Reporting/m-p/1154963 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | HubSpot’s default “Lead Response Time” measures owner assignment → first qualifying engagement (email, call, chat, meeting outcome, or task progress). Teams often add custom timestamps when they need form-submit → first buyer-facing touch. |
| **IMPLICATION** | Response-time KPIs require an explicit operating definition; platform defaults may not match SMB inbound workflows. |
| **JS SOLUTIONS DECISION** | First response = `Lead.createdAt` → first OUTBOUND `FollowUpActivity` on that lead. `responseRate` = **NOT_CAPTURED** until history matures. |

### 3. Salesforce — activity timeline vs exhaustive logs

| Field | Value |
|---|---|
| **SOURCE** | Salesforce Help — Activity Timeline deduplication |
| **URL** | https://help.salesforce.com/s/articleView?id=000391032 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Activity Timeline is a curated, summarized view; related lists and reports may show more rows. Timeline deduplicates certain synced events. |
| **IMPLICATION** | Operators need one authoritative commercial timeline; marketing systems must not silently overwrite or hide operator actions. |
| **JS SOLUTIONS DECISION** | Append-only `FollowUpActivity` rows are authoritative; editing `followUpAt` alone does not count as completion. |

### 4. Salesforce — engagement prioritization

| Field | Value |
|---|---|
| **SOURCE** | Salesforce Help — Prioritize Sales Outreach Based on Prospect Engagement |
| **URL** | https://help.salesforce.com/s/articleView?id=sales.hvs_engagement.htm |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Sales Engagement surfaces inbound replies, opens, and bounces in a work queue so reps prioritize engaged records. |
| **IMPLICATION** | Attention queues should elevate inbound replies and overdue commitments before passive nurture. |
| **JS SOLUTIONS DECISION** | Attention queue V2 sort: inbound reply awaiting → overdue → new inbound → due today → qualified w/o opportunity → opportunity overdue → aging/stale → upcoming → nurture. |

### 5. Pipedrive — activities and next-step fields

| Field | Value |
|---|---|
| **SOURCE** | Pipedrive Knowledge Base — Activities |
| **URL** | https://support.pipedrive.com/en/article/activities |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Activities (calls, meetings, tasks, emails) link to people, organizations, leads, and deals. Records expose **last activity date** and **next activity date** for scheduling. |
| **IMPLICATION** | Follow-up authority belongs on the commercial record (`followUpAt` / `nextActionAt`), not inferred from marketing events. |
| **JS SOLUTIONS DECISION** | Authority fields: `Lead.followUpAt`, `Prospect.followUpAt`, `Opportunity.nextActionAt`. |

### 6. Mailchimp — automation vs one-time campaigns

| Field | Value |
|---|---|
| **SOURCE** | Mailchimp Help — About Classic Automations |
| **URL** | https://mailchimp.com/help/about-classic-automations/ |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Regular campaigns send at an operator-chosen time. Automations send when trigger criteria are met and continue sequentially unless the contact exits the flow. |
| **IMPLICATION** | “Nurture” in CRM ops is not the same as an email drip sequence. |
| **JS SOLUTIONS DECISION** | JS Solutions **nurture** = operator-scheduled future follow-up on a Lead/Prospect. **Nurture ≠ drip.** No autonomous sequences in V1. |

### 7. Mailchimp — consent and unsubscribe

| Field | Value |
|---|---|
| **SOURCE** | Mailchimp Help — The Importance of Permission; About Unsubscribes |
| **URL** | https://mailchimp.com/help/the-importance-of-permission/ · https://mailchimp.com/help/about-unsubscribes/ |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Marketing email requires express, verifiable consent. Every campaign must include an unsubscribe mechanism; sending to unsubscribed contacts violates CAN-SPAM and platform terms. |
| **IMPLICATION** | Outbound follow-up must respect suppression before any send — automated or manual. |
| **JS SOLUTIONS DECISION** | Reuse `SuppressionEntry` + `Prospect.outreachStatus = SUPPRESSED`. Block new OUTBOUND prospect activities when suppressed. JS Solutions does **NOT** auto-send. |

---

## FIRST_PARTY_FACT

1. Sprint 10 persists `ContactSubmission` with attribution; contact does **not** auto-create CRM `Lead`.
2. Sprint 9 introduced Lead Conversion Intelligence (observe-only); commercial models remain authoritative.
3. Prospecting already enforces human-approved Resend sends and daily caps; Sprint 11 adds operator activity logging, not delivery automation.
4. GA4 sanitizes internal `/reports/**` paths to route families (Sprint 1+).

---

## INFERENCE

- SMB operators respond faster when overdue and new inbound items surface in one queue — but platform task automation without human send gates increases compliance risk for mixed inbound/outbound pipelines.
- Recording activity type separately from acquisition channel avoids mis-attributing a Facebook-acquired lead’s phone call as “Facebook outreach.”

---

## HYPOTHESIS

- Explicit `FollowUpActivity` history will improve first-response median measurement without claiming full response-rate coverage in early weeks.
- Operator-scheduled nurture (14+ day horizon) reduces NOW-band noise without requiring drip infrastructure.

---

## JS_SOLUTIONS_OPERATING_RULE

1. **JS Solutions does NOT auto-send** — templates are copy helpers only; operators send via their own email/phone tools.
2. **Nurture ≠ drip** — nurture is a scheduled operator follow-up date, not a Mailchimp-style sequence.
3. **Lead ≠ Prospect** — inbound website/contact/audit leads vs outbound prospecting records; never sum KPIs.
4. **Acquisition ≠ activity channel** — `attributionJson` / acquisition channel is preserved; `FollowUpActivity.activityType` records what the operator did (EMAIL, PHONE_CALL, etc.).
5. **Operator timezone:** `America/Chicago` for due states and age bands.
6. **Lead age bands (days from `createdAt`):** NEW ≤ 3 · ACTIVE ≤ 14 · AGING ≤ 30 · STALE > 30.
7. **No OpenAI / Meta / Twilio / calendar sync / auto-send in V1.**
8. **Idempotency:** optional `idempotencyKey` on `FollowUpActivity` for rapid double-submit protection.
9. **Append-only activities** — no silent deletion of history.
10. **Suppression:** existing `SuppressionEntry` + prospect `outreachStatus = SUPPRESSED` gate outbound prospect logging.
