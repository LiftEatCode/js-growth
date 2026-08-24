# Facebook Content Operating System — JS Solutions

Use this when creating daily/weekly Facebook content. Internal only.

Related: [playbook](facebook-organic-playbook.md) · [weekly review](facebook-weekly-review.md) · [research](../research/facebook-organic-growth-2026.md)

---

## Content jobs (primary — pick one)

| Job | Intent |
|---|---|
| REACH | Discovery / broad recognition |
| ENGAGEMENT | Conversation / meaningful replies |
| FOLLOWER_GROWTH | Convert viewers → follows |
| AUTHORITY | Expertise / educational credibility |
| TRUST | Honesty, process, behind-the-scenes |
| TRAFFIC | Website sessions (UTM required) |
| AUDIT_CONVERSION | Drive free audit starts |
| LEAD_GENERATION | Contact / consultation intent |
| PROOF | Results / case-study observations (client-safe) |
| COMMUNITY | Local business community presence |

Secondary outcomes allowed; record **one** primary job in the ledger.

## Content pillars (V1 bounded)

Website conversion · SEO · Local SEO · GBP · Small-business growth · Website audits · Case studies · Common mistakes · Behind the scenes · Building JS Solutions · AI/automation · Resources

## Formats (track separately)

PHOTO · TEXT · LINK · REEL · VIDEO · CAROUSEL · LIVE

Do not conclude winners from Baseline photo share alone.

## Company vs founder roles

### COMPANY (JS Solutions Page)

Educational graphics, SEO/web/marketing insights, case studies, audit findings (anonymized), blogs/resources, service education, Reels, business updates, conversion-oriented assets.

### FOUNDER (personal presence)

Building JS Solutions, lessons, opinions, small-business observations, behind-the-scenes work, business-owner conversations, personal expertise.

**Do not** blindly duplicate identical posts. If the same topic appears on both, adapt framing and record separate ledger rows + UTMs.

## Posting cadence methodology

Meta does not mandate a fixed daily organic quota for Pages.

**V1 method:**

1. Set a weekly capacity (minimum: enough to run active experiments).  
2. Prefer quality + reply time over volume.  
3. Review weekly: if reach and engagement stall while capacity allows, increase frequency carefully.  
4. Never post engagement bait to “make cadence.”

Suggested starting capacity (TARGET, not forecast): **3–5 company posts / week** + **2–4 founder posts / week**, adjustable after 28 days of data.

## Content reuse rules

- Reuse ideas; do not spam identical unoriginal reposts.  
- When resharing blog/audit content, add native framing (insight first, link second when job requires it).  
- Cross-post company ↔ founder only with distinct job/framing.

## Comment / reply process

1. Reply to genuine comments within 24 hours when possible.  
2. Prefer substantive replies that continue the conversation.  
3. Move sales intent to DM/website/audit — do not argue publicly.  
4. Log notable comment threads in content notes when they drive engagement.

## CTA strategy

| Allowed | Avoid |
|---|---|
| Soft invite to audit / resource | “Like if…”, “Comment YES if…” |
| Clear website link when job = TRAFFIC/AUDIT | Reaction-vote bait |
| “Follow for weekly local SEO notes” occasionally | Share-to-win / tag-friends bait |

## Link strategy

1. Primary job REACH/ENGAGEMENT/AUTHORITY → prefer native (no link or link in comments after engagement starts — **test**, do not dogma).  
2. Primary job TRAFFIC/AUDIT_CONVERSION → include UTM link.  
3. Never UTM internal site navigation.

## UTM usage

| Publisher | Preset |
|---|---|
| Company | `utm_source=facebook&utm_medium=organic_social&utm_campaign=page_organic&utm_content=company_<slug>` |
| Founder | `utm_source=facebook&utm_medium=organic_social&utm_campaign=founder_content&utm_content=founder_<slug>` |

Builder: `/reports/growth/utm-builder`

## Measurement workflow

1. Publish.  
2. Create **one** `GrowthContentRecord` on `/reports/growth` (blank FB metrics = NOT_CAPTURED).  
3. After ~72h (and again ~7d), **update Insights numbers on the same record** — do not create another row for metric maturity.  
4. Check first-party Facebook attribution on growth dashboard / attribution view.  
5. Weekly review doc.

### Operator rule (website traffic jobs)

When a Facebook post’s job includes **website traffic / audit**, use the canonical tagged URL from the UTM builder. When a post is native engagement/authority with no link, do not force a website link merely for tracking.

### Duplicate-submit protection

- Client: submit button uses `useActionState` pending lock (`Saving…`, disabled) so rapid clicks cannot fire parallel creates from the UI.  
- Server: rapid resubmission of the same content identity within 120s is idempotent (returns the canonical row).  
- Server: a later create with an existing `utm_content` is rejected — one post = one canonical record.  
- Metric maturity uses `updateGrowthContentManualMetrics` + optional `GrowthContentMetricSnapshot` checkpoints (INITIAL / HOURS_72 / DAYS_7) via Edit / Record Metrics on `/reports/growth`.

### Observed zeros vs NOT_CAPTURED

Blank metric fields stay `null` (NOT_CAPTURED). An entered `0` (e.g. comments = 0) is a real observed zero.

### Sprint 4 execution

See `facebook-30-day-execution-plan.md` for experimental cadence, TARGET bands, schedule, and experiment sequencing.

## Weekly / monthly review

See `facebook-weekly-review.md`. Monthly: compare FACEBOOK snapshots to Baseline V1; recalibrate follower TARGET framework if needed.

## Experiment workflow

1. Pick template from `docs/growth/experiments/`.  
2. Define hypothesis + primary metric + window.  
3. Tag content jobs/formats correctly.  
4. Do not claim statistical significance from tiny samples.  
5. Record decision + next test.
