# Content Development Workflow

1. **Intelligence** — Search opportunity / gap / refresh recommendation with WHY.
2. **Plan** — `GrowthContentPlan` with provenance (`searchOpportunitySlug`).
3. **Brief** — Validated `ContentBriefV1` (extends Sprint 5 contract).
4. **Generate** — Operator click only (`GENERATE_DRAFT`). One plan at a time.
5. **Review** — Deterministic claim safety; readiness `NEEDS_WORK` / `REVIEW_REQUIRED` / `READY_FOR_HUMAN_APPROVAL`.
6. **Human edit** — Canonical `humanDraftJson`.
7. **Approve** — Operator sets `APPROVED`.
8. **Publish** — Existing app publish path (blog TSX / page deploy / Facebook manual). Then mark `PUBLISHED` with URL.
9. **Measure** — GSC / GA4 / Facebook ledger as appropriate.
10. **Learn** — Future sprints feed observations (not causal ML).

## Prohibited

- Auto-publish
- Mass generation
- Inventing founder stories (`FOUNDER_INPUT_REQUIRED`)
- Ranking / traffic / lead guarantees
- Creating `GrowthContentRecord` before Facebook publish
- Mutating commercial authority objects
