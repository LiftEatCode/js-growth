# Facebook Organic Growth Research — 2026

**Research date:** 2026-08-23  
**Purpose:** Evidence base for Growth Sprint 3 (`facebook-growth-v1`).  
**Baseline context:** Growth Baseline V1 Facebook window 2026-07-26 → 2026-08-22 (immutable).

---

## Sources

### Official (priority)

| Source | URL | Classification |
|---|---|---|
| Meta Transparency Center — Facebook Feed ranking | https://transparency.meta.com/features/ranking-and-content | Official |
| Meta Transparency Center — Explaining ranking | https://transparency.meta.com/features/explaining-ranking/ | Official |
| Meta Business Help — How Facebook distributes content | https://www.facebook.com/business/help/718033381901819 | Official |
| Meta Transparency Center — Engagement bait | https://transparency.meta.com/features/approach-to-ranking/content-distribution-guidelines/engagement-bait | Official |
| Meta Transparency Center — Repeatedly posting low-quality content | https://transparency.meta.com/enforcement/taking-action/repeatedly-posting-low-quality-content/ | Official |
| Meta for Creators — Avoiding violations / distribution guidelines | https://creators.facebook.com/avoiding-violations-and-staying-safe-on-facebook/ | Official |
| Meta Business Help — Insights in Meta Business Suite | https://www.facebook.com/business/help/700570830721044 | Official |
| Meta Newsroom — Fighting engagement bait (historical policy basis) | https://about.fb.com/news/2017/12/news-feed-fyi-fighting-engagement-bait-on-facebook/ | Official (historical) |

### Secondary (supporting only)

| Source | URL | Notes |
|---|---|---|
| Industry explainers summarizing Meta ranking | Various 2025–2026 blogs | Use only where they cite Meta; treat % claims as **hypothesis** unless Meta-published |

---

## Research refresh (Sprint 4 — 2026-08-23)

No change to core ranking FACTS from Sprint 3.

**Execution questions:**

**FACT:** Meta does not publish a universal “post X times/day” organic Page rule in ranking docs; Insights/Business Suite remain the measurement surface.  
**HYPOTHESIS:** 3–5 company + 2–4 founder posts/week is a workable observation cadence for a small Page.  
**TEST:** 30-day experimental cadence (see `facebook-30-day-execution-plan.md`); recalibrate after Week 2.

**FACT:** Audience “when fans are online” style Insights exist in Meta Business Suite (operator UI).  
**HYPOTHESIS:** Timing optimization matters less than content job + format experiments at 75 followers.  
**TEST:** Prefer experiment isolation over fine-grained dayparting in month 1.

Industry posting-frequency blogs remain **secondary / hypothesis only**.


Meta states Feed is personalized via ML ranking, not simple chronology.

For **connected content** (friends, followed Pages, joined Groups), Meta documents a four-step process:

1. **Inventory** — eligible posts from connections  
2. **Signals** — thousands of signals (interactions, views, relationship strength, post features)  
3. **Predictions** — likelihood of meaningful interactions (e.g. comment, conversation), “worth your time,” and reduced distribution for problematic content  
4. **Score** — relevance score ordering, with balance across sources so users do not see many posts from the same Page in a row  

Meta also states Feed mixes **connected content** with **recommended content** (from accounts the user may not follow) plus ads.

**Confidence:** High (official Transparency Center + Business Help).

### Non-follower / recommended distribution (FACT + HYPOTHESIS)

**FACT:** Meta explicitly describes recommended/unconnected content as part of Feed.

**HYPOTHESIS:** JS Solutions’ Baseline V1 signal of **95.3% non-follower views** may indicate meaningful discovery inventory — but we do not yet know conversion quality into follows, visits, website traffic, or commercial outcomes.

**TEST:** Track non-follower view % alongside follower growth, Page visits, and first-party Facebook UTMs for 28+ days.

**Confidence:** High that recommendations exist; Low that our 95.3% proves a durable strategy.

### Meaningful interactions (FACT)

Meta ranking predictions emphasize comments, shares that spark discussion, and survey-based “worth your time” — not only likes.

**HYPOTHESIS:** Posts that invite genuine local-business discussion (without engagement bait) may outperform pure broadcast posts for distribution.

**TEST:** Comment-driven discussion posts vs informational posts (Experiment H).

### Engagement bait & low quality (FACT)

Meta demotes posts that **explicitly request** likes, shares, comments, tags, or reactions to manipulate distribution (with exceptions for genuine help/petitions/etc.).

Repeated engagement bait or repeatedly posting **unoriginal/repurposed** content without new value can trigger broader Page demotions.

**JS Solutions will NOT:** “Like if…”, “Comment YES if…”, reaction-vote bait, share-to-win schemes.

### Original vs duplicate content (FACT)

Meta demotes repeatedly unoriginal/repurposed content. Adding new value matters.

**HYPOTHESIS:** Native educational carousels/photos with JS Solutions framing outperform bare link shares of the same blog URL.

**TEST:** Native-value post vs outbound-link post (Experiment B).

### Formats — photo / video / Reels / links (MIXED)

**FACT (JS Baseline V1):** 90.3% of captured views were photo; 7.0% text; 2.6% link. Total views overall were **NOT_CAPTURED**.

**FACT (Meta):** Ranking uses content-type interaction history (photos, video, Reels, etc.) as signals; Feed tries to balance content types.

**NOT ASSUMED:** “Photos are best for JS Solutions.” High photo share may reflect what we posted, not what performs best.

**TEST:** Photo vs text educational; Reel vs static for same topic (Experiments A, F). Measure fairly with enough samples — do not claim significance from tiny n.

### Link posts / outbound links (HYPOTHESIS-heavy)

Meta does not publish a simple “links are banned” rule in the ranking overview. Industry claims about link demotion are **not** treated as FACT unless Meta states them.

**Operating rule for JS Solutions:** Prefer native value first; use outbound links when the primary job is TRAFFIC or AUDIT_CONVERSION, always with UTM tagging. Measure, do not assume.

### Page followers & visits (FACT)

Business Suite Insights exposes overview metrics such as Views and Follows (past ~28 days), plus audience/content reporting — used for manual snapshots in V1 (no Graph API this sprint).

### Posting frequency & timing (UNKNOWN → METHOD)

Meta does not publish a universal “post X times/day” organic rule in the ranking docs reviewed.

**JS Solutions will NOT assume** a fixed daily quota. Cadence is set by capacity + experiment schedule (see content operating system).

### Company Page vs founder/personal (EXPERIMENT)

Official ranking docs distinguish connected vs recommended content and Pages vs friends, but do **not** prescribe a dual “company + founder” distribution strategy for local service businesses.

**Classification:** Strategic experiment for JS Solutions (separate roles, separate UTMs, separate ledger rows).

### Hashtags / captions / CTAs (LIMITED OFFICIAL)

No strong official organic ranking playbook for hashtag volume found in the primary sources above.

**JS Solutions will NOT assume** hashtags drive distribution. Captions should serve the post’s primary job; CTAs must avoid engagement bait while remaining clear.

### Privacy & attribution (JS Solutions FACT)

First-party UTM + `attributionJson` remain the website/commercial bridge. GA4 never receives commercial IDs/PII. Meta API not used on dashboard load.

---

## Strategy recommendations (FACT / HYPOTHESIS / TEST)

### 1. Optimize for meaningful interaction, not bait

**FACT:** Meta demotes engagement bait; predicts conversation-worthy content.  
**HYPOTHESIS:** Genuine questions about local SEO/website problems increase comments without demotion.  
**TEST:** Experiment H — discussion vs informational.

### 2. Treat non-follower reach as a funnel stage

**FACT:** Recommended content exists; our baseline shows high non-follower view %.  
**HYPOTHESIS:** Soft follow CTAs and strong Page profile can convert discovery → followers.  
**TEST:** Experiment G — follow CTA vs none; track Page visits + net follows.

### 3. Separate company and founder distribution

**FACT:** Connected inventory differs for Pages vs personal friends.  
**HYPOTHESIS:** Founder posts drive recognition/trust; Page posts drive authority/proof/conversion assets.  
**TEST:** Experiment C — same topic, different publisher; compare layers 1–5 separately.

### 4. Native value before hard links

**FACT:** Unoriginal/low-quality patterns are demoted; outbound-link performance is under-specified officially.  
**HYPOTHESIS:** Native educational posts win distribution; link posts win website sessions when job is TRAFFIC.  
**TEST:** Experiment B.

### 5. Measure both audience and business outcomes

**FACT:** Baseline captures followers/visits/engagements; website outcomes need UTM + first-party.  
**HYPOTHESIS:** Follower growth and engagement contribute to social proof for a small service firm without guaranteeing revenue.  
**TEST:** Scorecard layers 1–5 over 30/60/90 days — never collapse to one “Facebook score.”

---

## What Meta explicitly states

- Feed ranking is personalized ML (inventory → signals → predictions → score).  
- Connected and recommended content both appear.  
- Predictions include interaction likelihood and reduced distribution for problematic content.  
- Engagement bait and repeatedly low-quality/unoriginal content receive demotion.  
- Insights in Business Suite support organic performance review.

## What is inferred

- Non-follower % at JS Solutions may be recommendation-driven discovery.  
- Format mix in baseline reflects inventory, not proven winners.  
- Founder vs Page dual strategy may diversify inventory types.

## What remains unknown

- Exact weight of any single signal for a small Page.  
- Whether links are systematically demoted relative to native media in 2026.  
- Optimal posting frequency for JS Solutions.  
- Causal path from followers → clients for our niche (must be measured).  
- Reliable visit → follow conversion without Meta API automation.

## What JS Solutions will test

See `docs/growth/experiments/` Facebook experiments A–H and website→Facebook follow loop.

## What JS Solutions will NOT assume

- “Post every day.”  
- “Video always wins.”  
- “Photos are best because baseline was 90% photo.”  
- “Followers = revenue.”  
- “Engagement is vanity and should be ignored.”  
- “Hashtags drive reach.”  
- Meta Graph API is required for V1 measurement.
