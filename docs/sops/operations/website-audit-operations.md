# SOP — Website Audit Operations

**Status:** Current  
**Audience:** Operators reviewing Free / Professional Website Growth Audits

---

## Purpose

Review audits correctly, use Professional features safely, and avoid overstating results to clients.

---

## Procedure

### 1. Locate the report

- Public: `/report/[id]` (UUID)
- Internal: `/reports` workspace → open lead/report

### 2. Read deterministic facts first

- Website Growth Score and category scores
- Findings and evidence
- Crawl / site overview (representative scan — **not** every URL)

Do **not** treat AI prose as the source of scores.

### 3. Free vs Professional

| Free | Professional |
|---|---|
| Limited priorities / quick wins | Full plan, findings, PDF |
| No OpenAI | AI Interpretation after entitlement |
| Upgrade via Stripe | Entitlement on `ReportPurchase` |

### 4. AI Interpretation

- Explains stored deterministic evidence
- Generated for entitled Professional reports (persisted/reused)
- If AI conflicts with findings, **trust the findings**

### 5. Public competitive URLs (if present)

- Explicit competitor URLs only (max 3)
- Bounded competitor scans on the **same** audit product
- **Not** the Prospecting Competitive Intelligence pipeline

### 6. Failed or weak audits

- Site unreachable / blocked → do not invent scores
- Thin evidence → qualify language; prefer human site review
- Re-run only when URL/fix is wrong or site changed materially

### 7. Client communication

Avoid claiming: rankings, traffic, revenue impact, “guaranteed #1,” full-site crawl completeness, or compliance certifications from the audit alone.

---

## Checklist

- [ ] Confirmed Free vs Pro entitlement
- [ ] Reviewed score + top findings
- [ ] Separated facts from AI summary
- [ ] PDF used only when entitled
- [ ] Claims match evidence

## Related

- [../../commercial-launch-v1.md](../../commercial-launch-v1.md)
- [../../development/ai-architecture.md](../../development/ai-architecture.md)
- [outreach-safety.md](outreach-safety.md)
