# Content Intelligence & AI-Assisted Development Research — 2026

**Research date:** 2026-08-23  
**Access date:** 2026-08-23  
**Purpose:** Ground Growth Sprint 6 (Content Intelligence & Development Engine V1) in official Google Search and OpenAI guidance.

---

## OFFICIAL GUIDANCE

### 1. Generative AI content on websites

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Using generative AI content |
| **URL** | https://developers.google.com/search/docs/fundamentals/using-gen-ai-content |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Generative AI can help research and structure original content. Using generative AI (or similar tools) to generate many pages without adding value for users may violate scaled content abuse spam policy. AI-assisted work must meet Search Essentials and spam policies. |
| **IMPLICATION** | Sprint 6 must be one-plan-at-a-time, human-reviewed, people-first — never mass generation. |
| **JS SOLUTIONS DECISION** | No mass generate. Operator-initiated drafts only. Human approval required. No auto-publish. |

### 2. Scaled content abuse

| Field | Value |
|---|---|
| **SOURCE** | Google Search spam policies |
| **URL** | https://developers.google.com/search/docs/essentials/spam-policies |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Scaled content abuse = many pages created primarily to manipulate rankings, not help users — regardless of automation, AI, or humans. Examples include generative AI producing many low-value pages. |
| **IMPLICATION** | “Generate 100 SEO blogs” is out of policy and out of product scope. |
| **JS SOLUTIONS DECISION** | Explicitly prohibit mass generation in V1. Prefer REFRESH / DO NOTHING when justified. |

### 3. People-first helpful content

| Field | Value |
|---|---|
| **SOURCE** | Creating helpful, reliable, people-first content |
| **URL** | https://developers.google.com/search/docs/fundamentals/creating-helpful-content |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Ranking systems prioritize helpful, reliable, people-first content. Search-engine-first / scaled automation for rankings is misaligned. |
| **IMPLICATION** | Briefs and drafts must optimize for usefulness and business accuracy, not keyword density. |
| **JS SOLUTIONS DECISION** | Quality review includes helpfulness, intent alignment, claim safety — never a fake “Google score.” |

### 4. AI-generated content (consistency)

| Field | Value |
|---|---|
| **SOURCE** | Google Search blog — AI-generated content guidance |
| **URL** | https://developers.google.com/search/blog/2023/02/google-search-and-ai-content |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Automation including AI used primarily to manipulate rankings is spam. Appropriate AI use to help create original, helpful content is not banned. |
| **IMPLICATION** | AI is an assistant under human editorial control, not a ranking hack. |
| **JS SOLUTIONS DECISION** | Market as human-reviewed AI assistance; never as guaranteed ranking tool. |

### 5. OpenAI Structured Outputs / Responses API

| Field | Value |
|---|---|
| **SOURCE** | OpenAI Structured Outputs guide + Node `zodTextFormat` |
| **URL** | https://developers.openai.com/api/docs/guides/structured-outputs |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Responses API supports structured outputs via `text.format` / `zodTextFormat`. Schema adherence is stricter than JSON mode. JS Growth already uses this pattern for audit/CI/outreach/implementation AI. |
| **IMPLICATION** | Reuse Responses + Zod; do not invent Chat Completions or a parallel AI SDK stack for Sprint 6. |
| **JS SOLUTIONS DECISION** | Fifth OpenAI path: content development — same Responses + zodTextFormat + shared openai-params/errors. |

---

## SECONDARY RESEARCH

Industry “GEO/AEO” or “AI SEO rank” claims remain unsupported relative to Google’s published guidance. Treat as hypothesis only.

---

## INFERENCE

A planner that encodes known Search Opportunity facts before calling the model reduces hallucinated business structure and cost.

---

## HYPOTHESIS

Deterministic collision detection + claim regexes will catch a large share of unsafe drafts before optional AI review.

---

## Data that must NOT be sent to the model

Client/project/opportunity/proposal/agreement/payment IDs, secure tokens, Stripe IDs, emails, phones, private commercial notes. Public/business-safe context only for Sprint 6 internal growth content.
