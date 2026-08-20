# SOP — Prospecting Campaign

**Status:** Current  
**Audience:** Internal operators using Prospecting Engine V1

---

## Purpose

Run an end-to-end campaign: discover → qualify → contact → human-approved outreach → outcomes → optional lead conversion.

**Principle:** Optimize for credible qualified prospects, not volume sends.

---

## Stop conditions (always)

Stop or Skip when: weak audit evidence, no credible outreach finding, unreliable contacts, already contacted / customer / suppressed, audit failure, misleading findings, or campaign mismatch.

**Never:** auto bulk send, auto submit contact forms, bypass CAPTCHA, ignore suppression.

---

## Procedure

1. **Create campaign** — `/reports/prospecting/new` (location, industries, desired qualified count).
2. **Discover** — Discover Businesses (Places). Review candidates; prefer quality over max API use (≤3 Places requests / run, ≤25 candidates).
3. **Import** — Import Selected only.
4. **Audit & qualify** — Explicit run; reuse TTL when valid (≤10 audits / run).
5. **Select outreach** — Top N and/or manual selection; Skip freely.
6. **Find contacts** — Explicit discovery (≤10 / run). Review emails and forms.
7. **Generate drafts** — Explicit Generate Missing Drafts (≤5 AI / run). Edit thoroughly.
8. **Approve & send email** — Human approval → Resend. Respect daily email cap (10) and suppression.
9. **Contact forms** — Copy approved message; **submit manually** in a real browser. Record outcome.
10. **Delivery** — Review Resend delivery events / statuses.
11. **Outcomes** — Record replies, meetings, not interested, etc.
12. **Convert lead** — Only when appropriate; Prospect ≠ Lead until conversion.

Optional parallel track: [Competitive Analysis SOP](competitive-analysis.md) after a prospect is qualified.

---

## Caps (code)

| Step | Cap |
|---|---|
| Places requests / discovery run | 3 |
| Candidates / run | 25 |
| Prospect audits / run | 10 |
| Contact discoveries / run | 10 |
| AI drafts / run | 5 |
| Emails / day | 10 |

---

## Checklist

- [ ] Campaign scope clear
- [ ] Candidates reviewed before import
- [ ] Weak fits Skipped with reason
- [ ] Contacts verified
- [ ] Drafts edited and approved
- [ ] Suppression checked
- [ ] Forms submitted manually only
- [ ] Outcomes recorded

## Related

- [../../development/prospecting-engine-v1.md](../../development/prospecting-engine-v1.md)
- [outreach-safety.md](outreach-safety.md)
- [competitive-analysis.md](competitive-analysis.md)
