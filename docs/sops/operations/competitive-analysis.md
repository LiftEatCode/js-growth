# SOP — Competitive Analysis

**Status:** Current (Competitive Intelligence V1 through Sprint 13.1)  
**Audience:** Internal operators

---

## Purpose

Produce a client-ready **Competitive Website Growth Analysis** preview for a qualified prospect using deterministic audits + optional AI explanation.

**Internal only** in V1 — no public share product.

---

## Scores (do not confuse)

| Score | Use |
|---|---|
| **Competitive relevance** | Is this business a sensible local competitor candidate? |
| **Website Growth Score** | How does each website score on the audit engine? |

---

## Procedure

1. Open a **qualified** prospect in `/reports/prospecting/.../prospects/[id]`.
2. Ensure competitive profile / vertical context is sensible.
3. **Discover competitors** (Places) — review candidates; reject poor geography or vertical fit.
4. **Select ≤ 3** competitors. Prefer clear local peers with crawlable websites.
5. **Audit selected competitors** (≤3 / run; 30-day TTL reuse). Re-run only when stale or site changed.
6. **Generate comparison** (deterministic) — review gaps, advantages, opportunities, ranking.
7. **Generate AI interpretation** only after comparison looks right — explicit button; review claims and English quality.
8. If interpretation is weak/wrong language: Regenerate after fixing evidence; do not invent client claims.
9. **Preview** Competitive Growth Analysis (`…/competitive-report`) — print/share **internally** as currently supported.
10. Use with clients only via controlled operator process (V1 has no public link product).

---

## When NOT to use a suggested competitor

- Wrong city/region or service area
- Marketplace aggregators / directories mistaken as peers
- No usable website / blocked crawl
- Different vertical after normalization
- Low relevance with no operator judgment supporting inclusion
- Already selected max (3)

When geography is questionable: reject, narrow profile, or rediscover — do not force a comparison that will mislead.

---

## Authority chain (client talk track)

Website Audit facts → Comparison facts → AI explanation → Presentation.  
AI never creates the underlying competitive numbers.

---

## Checklist

- [ ] Prospect fit confirmed
- [ ] ≤3 relevant competitors selected
- [ ] Audits current enough
- [ ] Comparison reviewed
- [ ] Interpretation reviewed against source evidence
- [ ] Preview readiness = READY before client-facing use

## Related

- [../../development/competitive-intelligence.md](../../development/competitive-intelligence.md)
- [website-audit-operations.md](website-audit-operations.md)
- [outreach-safety.md](outreach-safety.md)
