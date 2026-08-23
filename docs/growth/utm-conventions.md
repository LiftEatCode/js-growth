# UTM Conventions (`utm-standard-v1`)

Internal builder: `/reports/growth/utm-builder`

## Rules

1. Lowercase values; underscores for spaces.
2. Always set `utm_source`, `utm_medium`, `utm_campaign` together for tagged links.
3. Use `utm_content` for post/creative identity when useful.
4. **Never** append UTMs to ordinary internal navigation.
5. **Never** put PII or commercial IDs in UTMs.
6. Organic Google search: leave as native `google / organic` (no UTM on SERP URLs).

## Sources

`facebook` · `instagram` · `youtube` · `google_business_profile` · `email` · `outreach` · `partner` · `qr` · `linkedin` · `newsletter`

## Mediums

`organic_social` · `paid_social` · `organic_video` · `paid_video` · `email` · `referral` · `offline` · `organic_local` · `cpc`

## Facebook

| Channel | Example |
|---|---|
| Business Page post | `utm_source=facebook&utm_medium=organic_social&utm_campaign=website_growth&utm_content=website_leads_post_01` |
| Founder/personal post | `utm_source=facebook&utm_medium=organic_social&utm_campaign=founder_content&utm_content=…` |
| Paid (later) | `utm_source=facebook&utm_medium=paid_social&utm_campaign=…` |

Keep Page vs personal baselines separate in reporting.

## Google Business Profile

`utm_source=google_business_profile&utm_medium=organic_local&utm_campaign=gbp_website`  
(when the website URL field can be tagged)

GBP Audit/Optimizer SaaS is **not** part of Growth Sprint 1.

## Blog / SEO

Internal CTAs use **event metadata** (`blog_cta_clicked`, `service_cta_clicked`) — not internal UTMs.
