# SOP — Production Acceptance

**Status:** Current  
**Audience:** After production deploy of JS Growth

Reusable checklist. Not every item applies to every deploy — check what changed.

---

## Website Audit

- [ ] Free audit completes on a known site
- [ ] Score/findings render on `/report/[id]`
- [ ] Free path makes **no** OpenAI call
- [ ] Failed URL handled without crashing

## Payments

- [ ] Checkout starts for Professional (test or live as intended)
- [ ] Webhook marks purchase PAID
- [ ] Professional content unlocks after refresh
- [ ] PDF gated correctly
- [ ] Price label matches Stripe Price

## Prospecting

- [ ] Internal login works
- [ ] Campaign create / list
- [ ] Discovery run respects caps
- [ ] Import → audit/qualify
- [ ] Contact discovery
- [ ] Draft generate requires explicit action

## Email / Resend

- [ ] Approved send works in intended mode
- [ ] Webhook receives delivery events
- [ ] Suppression blocks send
- [ ] Daily cap enforced
- [ ] Contact forms still **manual** only

## Competitive Intelligence

- [ ] Competitor discovery + select ≤3
- [ ] Competitor audits complete
- [ ] Comparison generates without OpenAI
- [ ] Interpretation only on explicit generate
- [ ] Competitive report preview READY path
- [ ] Report load does not call OpenAI/Places/crawl
- [ ] CI routes remain internal (not public `/report`)

## Implementation Plan (Commercial Sprint 1)

- [ ] Generate on audited prospect (audit-only works)
- [ ] Optional current comparison strengthens priorities
- [ ] Stale comparison excluded from evidence
- [ ] Workstreams show evidence, capabilities, actions, preservation
- [ ] Remove / reorder / priority / approve require session
- [ ] Rebuild creates new snapshot; prior plan SUPERSEDED
- [ ] Not exposed on public `/report/*`
- [ ] Generate does not call OpenAI / Places / crawl / Resend

## AI

- [ ] Pro audit AI only when entitled
- [ ] Outreach drafts capped
- [ ] CI interpretation validates / rejects bad language or claims as designed

## Isolation

- [ ] Public report does not expose prospect contacts
- [ ] Internal CI not indexed / not on public audit routes
- [ ] Analytics events free of obvious PII

## Infra

- [ ] `npx prisma migrate status` reviewed
- [ ] Env vars present for touched integrations
- [ ] Error logs clean for smoke paths

## Related

- [../development/deployment.md](../development/deployment.md)
- [../../development/product-catalog.md](../../development/product-catalog.md)
