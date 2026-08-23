# Client / Project Onboarding (Commercial Sprint 10)

## Purpose

Operational handoff after commercial payment eligibility:

**Payment creates eligibility. A human converts the Opportunity into a Client engagement.**

The Project must deliver the **exact** commercial scope that was accepted. Delivery must not silently change what was sold.

## Prospect vs Opportunity vs Client

| Entity | Meaning |
|--------|---------|
| **Prospect** | Sales/intelligence target in a campaign |
| **Opportunity** | Commercial pursuit (scope → pricing → proposal → agreement → payment) |
| **Client** | Durable JS Solutions customer record created at conversion |

These are distinct. Do not treat them as interchangeable.

## Version

- `CLIENT_PROJECT_ONBOARDING_VERSION = 1`
- `PROJECT_COMMERCIAL_SNAPSHOT_VERSION = 1`
- `ONBOARDING_CHECKLIST_VERSION = 1`

## Migration

`prisma/migrations/20260823190000_add_clients_projects`

Sorts **after** `20260823180000_add_commercial_payments` (do not rename prior migrations).

## Domain module

`src/lib/commercialization/onboarding/`

## Onboarding eligibility (`getOnboardingEligibility`)

Requires:

1. Opportunity exists
2. Agreement exists with `status === ACCEPTED`
3. Payment requirements satisfied per accepted terms

| Term type | Start onboarding when |
|-----------|------------------------|
| `DEPOSIT_AND_BALANCE` | **Deposit PAID** (balance may remain due before final handoff) |
| `FULL_UPFRONT` | **FULL PAID** |
| `CUSTOM` | Blocked (ambiguous) unless future structured override |

**Decision (documented):** Deposit-start is intentional. Do not equate “Ready for onboarding” with “Paid in full.”

Payment webhooks **never** mark Opportunity `WON` and never create Client/Project.

## WON policy

Opportunity becomes `WON` only via explicit operator action:

**[Convert to Client / Start Onboarding]**

Requires eligibility. Transactionally:

- `stage → WON`, `wonAt` set
- Client created or reused
- `ClientProject` created (`ONBOARDING`)
- Immutable commercial snapshot
- Workstreams + presentation deliverables
- Canonical `ProjectDeliveryTask`s (deduped by `sourceActionKey`)
- Capability-aware onboarding checklist
- Opportunity + Project activity events

Conversion is **idempotent** (`opportunityId` / `agreementId` unique on project).

## Client identity / dedupe

Priority:

1. Explicit operator `selectedClientId` (when hostname is ambiguous)
2. `opportunity.clientId`
3. Prospect’s existing Client (`sourceProspectId`)
4. Client with `sourceOpportunityId`
5. Single ACTIVE Client matching normalized website hostname
6. Otherwise create new Client

No fuzzy merges. Multiple hostname matches → `AMBIGUOUS_CLIENT`.

### Contact seeding (initial only)

1. Agreement signer  
2. Agreement delivery recipient  
3. Prospect contact  

Never overwrite manually corrected Client contact on retry.

## Project commercial snapshot

`ClientProject.commercialSnapshotJson` captures accepted delivery facts at conversion (sections, deliverables, assumptions, exclusions, investment, payment terms, source IDs).

Upstream Scope/Pricing/Proposal/Agreement/Payment records are **not mutated** by conversion.

No casual edit of sold deliverables on the Project. Future Change Order engine (not in Sprint 10).

## Delivery deduplication

- **ProjectWorkstream** / **ProjectDeliverable** — commercial presentation structure  
- **ProjectDeliveryTask** — canonical execution (`@@unique([projectId, key])`)  

Key = `action:{sourceActionKey}` or `deliverable:{id}`.

One implementation completes once even if it appears under multiple workstreams.

## Onboarding checklist

Deterministic, capability-aware (`WEBSITE_DEVELOPMENT`, `SEO`, `LOCAL_SEO`, `CONTENT`, `CONVERSION_OPTIMIZATION`).

Tracks access status (**Requested / Received / Not required**) — **never passwords**. Notes reject credential-like content.

Derived states: `NOT_STARTED` → `WAITING_ON_CLIENT` → `READY_FOR_KICKOFF` → (human) `ACTIVE` → …

## Balance before final handoff

After deposit-start:

- Project shows Deposit Paid + Balance Due  
- Implementation may complete with balance outstanding  
- Derived `FINAL_HANDOFF_BLOCKED_BY_BALANCE`  
- Marking `COMPLETED` requires paid-in-full **or** override reason (≥ 8 chars)

## Routes (internal only)

- `/reports/clients`
- `/reports/clients/[clientId]`
- `/reports/clients/[clientId]/projects/[projectId]`

No client portal. No file uploads. No automatic onboarding email (Resend = 0). No Stripe calls during onboarding reads/updates.

## Activity design

- **OpportunityActivity** — commercial + conversion milestones (`CLIENT_CREATED`, `PROJECT_CREATED`, `ONBOARDING_*`, `PROJECT_*`)
- **ProjectActivity** — operational history on the Project

## Side-effect budget

Conversion / project page / checklist updates:

OpenAI 0 · Places 0 · crawl 0 · contact discovery 0 · Resend 0 · Stripe 0

Use persisted `CommercialPayment` state only.

## Future

- Change Order / Change Request engine  
- Client portal  
- Secure credential vault (not Sprint 10)  
- Optional explicit “Send Onboarding Request” email  

## Tests

- `src/lib/commercialization/onboarding/client-project.verify.ts`
- `tests/commercial/integration/onboarding-lifecycle.integration.ts`
- Playwright: deposit → Convert → checklist → Start Project
