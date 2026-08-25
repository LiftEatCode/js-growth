# Lead Follow-up & Nurture Operations V1

**LEAD_FOLLOWUP_VERSION = 1**  
Dashboard: `/reports/growth/follow-up` · Lead detail: `/reports/leads/[leadId]`

Research: [`../research/lead-followup-nurture-operations-2026.md`](../research/lead-followup-nurture-operations-2026.md)

## Principle

Capture what operators do. Preserve acquisition separately from activity channel. **No autonomous outreach.** No AI qualification. No auto-send.

Commercial ops activity model = **`FollowUpActivity`** (not `GrowthSnapshot`).

## Activity model — `FollowUpActivity`

Append-only rows linked to exactly one subject:

| Field | Purpose |
|---|---|
| `leadId` / `prospectId` / `opportunityId` | Subject (one required) |
| `activityType` | EMAIL, PHONE_CALL, TEXT_MESSAGE, FACEBOOK_MESSAGE, IN_PERSON, MEETING, NOTE, FOLLOW_UP, OTHER |
| `direction` | INBOUND, OUTBOUND, INTERNAL |
| `outcome` | SENT, REPLIED, CONNECTED, NO_ANSWER, … QUALIFIED, DISQUALIFIED, DO_NOT_CONTACT, … |
| `summary` | Operator note (internal; never GA4) |
| `occurredAt` | When the activity happened |
| `nextFollowUpAt` | Optional schedule set when recording |
| `createdByEmail` | Operator identity |
| `idempotencyKey` | Optional dedupe for rapid resubmit |

Recording an activity may update follow-up authority on the subject (`Lead.followUpAt`, `Prospect.followUpAt`, `Opportunity.nextActionAt`). Editing `followUpAt` alone is **not** completion — a real activity must occur.

## Taxonomies

- **Subject kinds:** LEAD · PROSPECT · OPPORTUNITY
- **Due states:** OVERDUE · DUE_TODAY · UPCOMING · NONE (evaluated in `America/Chicago`)
- **Priority bands:** NOW · NEXT · WATCH (from attention sort weight)
- **Lead age bands:** NEW (≤3d) · ACTIVE (≤14d) · AGING (≤30d) · STALE (>30d) — JS operating rules

## Follow-up authority

| Subject | Authority field |
|---|---|
| Lead | `Lead.followUpAt` |
| Prospect | `Prospect.followUpAt` |
| Opportunity | `Opportunity.nextActionAt` (+ `nextAction` text) |

## Attention queue V2 — priority order

Lower sort weight = higher priority. DO_NOT_CONTACT subjects are excluded.

1. Inbound reply awaiting response  
2. Follow-up overdue  
3. New inbound lead (status NEW, age band NEW)  
4. Follow-up due today  
5. Qualified lead without opportunity  
6. Opportunity next action overdue (or missing next action)  
7. Aging / stale inbound lead  
8. Follow-up upcoming  
9. Nurture review upcoming (follow-up ≥ 14 days out)

Queue cap: 40 items (`FOLLOW_UP_ATTENTION_LIMIT`).

## ContactSubmission → explicit Create Lead

Sprint 10 stores contact rows with attribution. Sprint 11 adds **explicit** “Create Lead” from `/reports/growth/follow-up`. No auto-Lead. Linking is idempotent — second create blocked when `ContactSubmission.leadId` is set.

## Templates (code-side, no auto-send)

`FOLLOW_UP_TEMPLATES` in `src/lib/follow-up/templates.ts` — copy/paste starting points (inbound, audit, contact, outbound prospect, proposal, agreement, nurture check-in). Operators send manually; system records activity separately.

## Operator workflow

### Daily

1. Open `/reports/growth/follow-up` — work **NOW**, then **NEXT**.  
2. For each item: open subject → record activity (type, direction, outcome, summary) → set next follow-up or clear.  
3. Respond to new inbound and inbound-reply-awaiting before nurture items.  
4. Use templates as drafts only; send outside the app.  
5. Create Leads from unlinked contact submissions when ready.

### Weekly

1. Review overdue / due-today counts and stale leads.  
2. Check first-response median (28-day window); treat `INSUFFICIENT_DATA` honestly when n < 3.  
3. Confirm suppression still blocks outbound prospect attempts.  
4. Cross-check acquisition channel unchanged after activities (Facebook lead stays FACEBOOK).

## Metrics

| Metric | Definition |
|---|---|
| First response median | Inbound `Lead.createdAt` → first OUTBOUND `FollowUpActivity`; n < 3 → `INSUFFICIENT_DATA`; none → `NOT_CAPTURED` |
| Response rate | **NOT_CAPTURED** (V1 — requires mature inbound/reply pairing) |
| Activities recorded | Count in window |
| Follow-ups due / overdue / completed | Operator calendar counts |
| Nurture count | Leads with follow-up ≥ 14 days out |
| Qualified / stale counts | Status + age band |

Timezone: `America/Chicago`. Windows: 7 / 28 / 90 days.

## Privacy

- No PII or commercial record IDs in GA4 custom events or params.  
- `/reports/leads/[leadId]` and `/reports/growth/follow-up` send sanitized route-family paths only.  
- Activity summaries and operator emails are internal DB fields — never analytics payloads.

## Suppression

Outbound prospect activities blocked when:

- `Prospect.outreachStatus = SUPPRESSED`, or  
- any linked contact is SUPPRESSED, or  
- hostname matches active `SuppressionEntry` (OPTED_OUT, COMPLAINT, BOUNCED, MANUAL).

Historical pre-suppression activities remain visible.

## Non-goals (V1)

- OpenAI draft assist  
- Meta / Twilio integration  
- Calendar sync or meeting scheduler  
- Autonomous email/SMS send  
- Auto-create Opportunity on QUALIFIED  
- Response-rate KPI until history supports honest measurement

## Related routes

| Route | Purpose |
|---|---|
| `/reports/growth/follow-up` | Attention queue, metrics, contact → lead |
| `/reports/leads/[leadId]` | Lead detail, activity timeline, nurture, qualify |
| `/reports/prospecting/.../prospects/[prospectId]` | Prospect activity + suppression UI |
| `/reports/opportunities/[id]` | Opportunity next-action (existing) |

Acceptance: [`growth-sprint11-production-acceptance.md`](growth-sprint11-production-acceptance.md)
