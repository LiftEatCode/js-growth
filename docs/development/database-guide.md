# Database Guide (Prisma)

High-level data model for JS Growth. **Do not treat this as a full schema dump** — see `prisma/schema.prisma`.

---

## Domains

1. **Website Growth Audit & commercial** — reports, purchases, optional public competitive URLs
2. **Leads / workspace** — CRM-lite for inbound and converted prospects
3. **Prospecting** — campaigns, prospects, contacts, outreach, delivery, outcomes, suppression
4. **Competitive Intelligence** — competitor candidates, audits, comparison snapshots, interpretations
5. **Commercialization** — implementation plan snapshots and workstreams

---

## Commercial & lead entities

| Model | Role | Mutability |
|---|---|---|
| `AuditReport` | Persisted deterministic audit (+ AI interpretation when entitled) | Mostly immutable facts; entitlement/AI fields update |
| `ReportPurchase` | Stripe purchase / entitlement for a report | Status transitions (e.g. → PAID) |
| `Lead` | Person/business CRM record for pipeline | Lifecycle mutable |
| `LeadActivity` | Timeline events on a lead | Append-oriented activity |

**Relationships:** A Lead may link to AuditReports. Public reports are accessed by report id/UUID without customer accounts.

---

## Prospecting entities

| Model | Role | Mutability |
|---|---|---|
| `Campaign` | Outreach campaign container | Mutable config / status |
| `Prospect` | Discovered business (≠ Lead) | Lifecycle mutable |
| `CampaignProspect` | Join / membership | Mutable |
| `ProspectDiscoveryRun` / `ProspectDiscoveryCandidate` | Places discovery history | Run records + candidates |
| `ProspectQualificationRun` | Audit/qualify batch | Historical run |
| `ProspectContact` | Discovered emails | Mutable status; TTL reuse patterns |
| `ProspectContactForm` | Discovered forms | Mutable; **submission is always manual** |
| `ProspectContactDiscoveryRun` | Contact discovery batch | Historical |
| `ProspectOutreachDraftRun` | AI draft batch | Historical |
| `OutreachMessage` | Draft → approved → sent messages | Lifecycle mutable |
| `OutreachDeliveryEvent` | Resend webhook events | Append-only |
| `OutreachOutcome` | Human-recorded outcome | Mutable / historical |
| `SuppressionEntry` | Do-not-contact | Durable; respect always |

**Prospect ≠ Lead.** Conversion to Lead is an explicit operator action.

---

## Competitive Intelligence entities

| Model | Role | Mutability |
|---|---|---|
| `ProspectCompetitor` | Candidate / selected / rejected competitor | Selection state mutable |
| `CompetitorDiscoveryRun` | Places CI discovery | Historical |
| `CompetitorAudit` | Historical website audit snapshot for a competitor | Append / version; TTL reuse |
| `CompetitorAuditRun` | Batch audit run | Historical |
| `CompetitiveComparisonSnapshot` | Deterministic comparison facts | Historical snapshots; “current” selected by app logic |
| `CompetitiveInterpretation` | AI explanation of a specific snapshot | Historical rows; regenerate creates new |

---

## Commercialization entities

| Model | Role | Mutability |
|---|---|---|
| `ImplementationPlan` | Deterministic recommendation snapshot | New rows on rebuild; status lifecycle; SUPERSEDED retained |
| `ImplementationPlanWorkstream` | Workstream within a plan | Operator may reorder/priority/remove; evidence JSON not falsified |
| `ImplementationPlanInterpretation` | AI strategy explanation of a plan | Historical COMPLETED/FAILED rows; bound to exact plan id |
| `Opportunity` | Human-created sales pursuit | Capability snapshot; stages; next action; WON/LOST |
| `OpportunityActivity` | Append-only commercial timeline | Created on state changes / notes |

Snapshots and interpretations are designed so prior generations remain available for auditability.

---

## Semantics to remember

- **Deterministic audit payloads** are the factual backbone for public reports, prospect qualification, and CI.
- **CompetitorAudit** is separate from public `AuditReport` — competitor audits are internal and not public report URLs.
- **Comparison** never requires OpenAI; **interpretation** is optional explanation layered on a snapshot.
- **Implementation plans** never require OpenAI; competitive evidence is optional and only from current comparisons.
- **Delivery events** should not be rewritten; suppressions override send paths.

---

## Migrations

- Schema changes require Prisma migrations — **not every app deploy**.
- Before deploy: `npx prisma migrate status`
- When pending migrations exist: `npx prisma migrate deploy` on the target database
- Docs-only / code-only deploys with no schema change: migrate deploy is **not** required

See SOP: [../sops/development/deployment.md](../sops/development/deployment.md).
