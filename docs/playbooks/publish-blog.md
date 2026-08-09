# Publish a Blog Article

This playbook defines the practical workflow for creating, publishing, validating, and promoting a new JS Solutions blog article.

It is intended to be used alongside the JS Solutions Blog Publishing SOP and SEO documentation.

---

# Purpose

The purpose of this playbook is to make publishing a new blog article repeatable, efficient, and SEO-conscious.

Each article should support at least one of the following goals:

- Build topical authority
- Attract qualified organic traffic
- Educate potential customers
- Support a service page
- Strengthen internal linking
- Promote the Website Growth Audit
- Generate leads
- Create reusable social media content

A blog should not exist simply to increase article count.

Every article should have a business purpose.

---

# When to Use This Playbook

Use this playbook whenever publishing a new article to the JS Solutions website.

Examples include:

- SEO education articles
- Local SEO articles
- Website strategy articles
- AI and automation articles
- Analytics articles
- Custom software articles
- Small business growth content
- Service-supporting articles
- Website audit supporting content

---

# Current Blog Architecture

JS Solutions currently uses a code-based blog system built into the Next.js application.

Blog content lives under:

```text
src/content/blog/
```

Each article is stored as its own `.tsx` content file.

Example:

```text
src/content/blog/how-much-does-a-small-business-website-cost.tsx
```

The blog registry is:

```text
src/content/blog/posts.tsx
```

The dynamic article route is:

```text
src/app/blog/[slug]/page.tsx
```

The dynamic route automatically generates:

- Article page
- Metadata
- Canonical URL
- Open Graph metadata
- Twitter metadata
- Structured data

A separate route does not need to be created for every article.

---

# Blog Publishing Workflow

## Step 1 — Select the Topic

Choose a topic that supports the current SEO and business strategy.

Before writing, determine:

- Primary topic
- Primary keyword
- Search intent
- Target customer
- Related JS Solutions service
- Relevant existing articles
- Desired conversion action

Prefer topics that fit an existing topic cluster.

Avoid publishing unrelated articles solely because they appear interesting.

---

## Step 2 — Define the Conversion Goal

Every article should have a logical next step.

Possible conversion goals include:

- Run the Website Growth Audit
- Read another related article
- Visit a service page
- Contact JS Solutions
- Request a consultation

The call to action should match the subject of the article.

Example:

An article about website lead generation should naturally direct readers toward the Website Growth Audit.

An article about Local SEO may direct readers toward Local SEO services or another Local SEO guide.

---

## Step 3 — Prepare SEO Information

Before creating the article file, define the following.

### Slug

Use a short, descriptive, keyword-relevant slug.

Example:

```text
why-most-small-business-websites-dont-generate-leads
```

Avoid:

- Dates unless necessary
- Unnecessary words
- Special characters
- Uppercase letters
- Very long URLs

---

### Title

The title should:

- Clearly describe the article
- Include the primary topic naturally
- Appeal to the intended reader
- Avoid clickbait

Example:

```text
Why Your Small Business Website Isn’t Generating Leads (7 Common Reasons)
```

---

### Description

Write a concise search description that explains what the article provides.

It should:

- Accurately describe the content
- Include relevant search terminology naturally
- Encourage qualified readers to click

Do not keyword-stuff.

---

### Category

Choose the most relevant existing category whenever possible.

Examples:

- Websites
- SEO
- Local SEO
- AI
- Automation
- Analytics
- Business Growth

Avoid creating unnecessary categories.

---

### Publish Date

Set both the human-readable and ISO dates.

Example:

```tsx
publishedAt: "August 8, 2026",
publishedAtIso: "2026-08-08",
```

---

### Reading Time

Estimate the approximate reading time.

Example:

```tsx
readingTime: "8 min read",
```

---

## Step 4 — Create the Article File

Create a new file in:

```text
src/content/blog/
```

Example:

```text
src/content/blog/why-most-small-business-websites-dont-generate-leads.tsx
```

Use the existing `BlogPost` type.

Basic structure:

```tsx
import Link from "next/link";

import type { BlogPost } from "./types";

export const examplePost: BlogPost = {
  slug: "example-post",

  title: "Example Blog Title",

  description:
    "Example search description.",

  category: "Websites",

  publishedAt: "August 8, 2026",

  publishedAtIso: "2026-08-08",

  readingTime: "8 min read",

  featured: false,

  content: (
    <>
      <p>
        Article introduction.
      </p>

      <h2>
        Section heading
      </h2>

      <p>
        Section content.
      </p>
    </>
  ),
};
```

---

## Step 5 — Write for the Reader First

The article should be useful even if the reader never becomes a customer.

Write primarily for small business owners.

Use:

- Clear language
- Short paragraphs
- Descriptive headings
- Examples
- Lists when useful
- Business-impact explanations
- Natural transitions

Avoid:

- Keyword stuffing
- Generic AI filler
- Excessive jargon
- Repeating the same point
- Artificial length
- Unnecessary sales language

---

## Step 6 — Protect Paid Implementation Value

JS Solutions should educate readers without publishing the complete implementation process for paid services.

The article should explain:

- What the issue is
- Why it matters
- How it affects the business
- What warning signs to look for
- What types of improvements may help

The article does not need to provide:

- Complete implementation code
- Detailed technical repair instructions
- Full client deliverables
- Complete SEO execution plans
- Every step required to perform paid work independently

The goal is informed prospects, not free consulting engagements.

---

## Step 7 — Structure the Article Properly

Use a clear content hierarchy.

A typical article should follow:

```text
Introduction
    ↓
Primary Problem
    ↓
Why It Matters
    ↓
Major Sections
    ↓
Examples or Practical Guidance
    ↓
Next Steps
    ↓
CTA
```

Use `h2` headings for major sections.

Use `h3` headings for subsections.

Example:

```tsx
<h2>
  Why Website Speed Matters
</h2>

<p>
  Main section content.
</p>

<h3>
  Mobile Performance
</h3>

<p>
  Supporting subsection content.
</p>
```

Avoid jumping between heading levels unnecessarily.

---

## Step 8 — Add Internal Links

Every article should include meaningful internal links where appropriate.

Potential destinations include:

```text
/blog
/website-audit
/contact
```

Also consider:

- Service pages
- Related articles
- Supporting guides
- Topic-cluster pages

Use descriptive anchor text.

Good:

```text
Learn what Local SEO is and why it matters.
```

Avoid:

```text
Click here.
```

Example:

```tsx
<p>
  Learn more in our guide explaining{" "}
  <Link href="/blog/what-is-local-seo">
    what Local SEO is and why it matters
  </Link>
  .
</p>
```

Internal links should help both the reader and the site's content structure.

Do not force links where they do not make sense.

---

## Step 9 — Add a Relevant CTA

The article should end with a logical next step.

### Website Audit CTA

```tsx
<p>
  <Link href="/website-audit">
    Run your free Website Growth Audit
  </Link>{" "}
  and see what may be holding your site back.
</p>
```

### Contact CTA

```tsx
<p>
  If you would rather discuss your website strategy directly,{" "}
  <Link href="/contact">
    contact JS Solutions
  </Link>
  .
</p>
```

The CTA should feel like a natural continuation of the article rather than an unrelated sales pitch.

---

## Step 10 — Add the Article to the Blog Registry

Open:

```text
src/content/blog/posts.tsx
```

Import the new article:

```tsx
import { newBlogPost } from "@/content/blog/new-blog-post";
```

Then add it to:

```tsx
export const blogPosts: BlogPost[] = [
  newBlogPost,
  ...
];
```

New articles should normally be placed near the beginning so the blog index displays recent content appropriately.

---

## Step 11 — Review Related Posts

Check whether the new article should link to existing content.

Also determine whether older articles should eventually link back to the new article.

Good internal linking creates content clusters instead of isolated articles.

Example:

```text
Small Business Websites
        │
        ├── Website Cost
        ├── Why Websites Don't Generate Leads
        ├── Website Speed
        ├── Conversion Optimization
        └── Website Audit Guide
```

---

## Step 12 — Validate Locally

Run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

All three should pass before publishing.

Then start the development server:

```bash
npm run dev
```

Review:

```text
http://localhost:3000/blog
```

Confirm the new article appears.

Then review:

```text
http://localhost:3000/blog/<article-slug>
```

---

## Step 13 — Review the Article in the Browser

Before pushing, manually inspect the article.

Verify:

- Title is correct
- Description is accurate
- Publish date is correct
- Reading time is reasonable
- Formatting works on desktop
- Formatting works on mobile
- Headings are properly structured
- Lists render correctly
- Internal links work
- CTA works
- No obvious spelling errors exist
- No obvious grammar problems exist
- Article provides real value
- Paid implementation is not unnecessarily given away

---

## Step 14 — Review SEO Presentation

Confirm the article:

- Uses the intended topic naturally
- Has a descriptive slug
- Has a strong page title
- Has an accurate description
- Uses logical headings
- Contains useful internal links
- Matches search intent
- Avoids keyword stuffing

Do not optimize purely for keyword density.

The content should sound natural to a business owner.

---

## Step 15 — Push to GitHub

Once validation succeeds:

```bash
git status
git add .
git commit -m "Add blog article: <short article name>"
git push
```

The connected Vercel project will automatically create a deployment.

---

## Step 16 — Validate the Vercel Deployment

After pushing:

1. Open the Vercel project.
2. Confirm the deployment starts.
3. Wait for the production build to finish.
4. Review build errors if deployment fails.
5. Do not promote the article until the deployment succeeds.

If the deployment fails:

```text
Vercel
    ↓
Project
    ↓
Deployments
    ↓
Failed Deployment
    ↓
Build Logs
```

Fix the specific build error before changing unrelated code.

---

## Step 17 — Validate Production

After Vercel finishes deployment, open the production article.

Verify:

- Article loads successfully
- `/blog` displays the article
- Article URL is correct
- Internal links work
- CTA works
- No styling problems are present
- No production errors occurred
- Desktop layout looks correct
- Mobile layout looks correct

---

## Step 18 — Create Social Promotion

A new article should normally be reused across marketing channels.

Create:

- Primary Facebook post
- Alternate Facebook post
- Instagram-compatible caption
- Engagement post
- Supporting image concept
- Relevant hashtags

The social content should focus on the business problem discussed in the article rather than simply saying:

> We published a new blog.

The preferred marketing path is:

```text
Social Content
      ↓
Blog Article
      ↓
Education + Trust
      ↓
Related Service or Website Growth Audit
      ↓
Lead
      ↓
Strategy Conversation
```

---

## Step 19 — Create the Blog Graphic

Create a social graphic that supports the article topic.

JS Solutions graphics should generally follow current brand direction:

- Modern
- Professional
- Premium
- Dark or black backgrounds
- White typography
- Blue accents
- Clear visual hierarchy
- Minimal overlay text

Do not put the entire article on the graphic.

Do not overload the graphic with text.

The visual should create curiosity.

Example overlay:

```text
Why Isn't Your Website Generating Leads?
```

---

## Step 20 — Add the Article to Future Content Rotation

A blog article is a reusable asset.

It may later support:

- Facebook posts
- Instagram posts
- Email newsletters
- Google Business Profile posts
- Sales follow-up
- Internal links from future articles
- Lead nurturing
- Website audit education
- Service-page supporting content
- Future pillar articles

Do not treat publication day as the end of the article's useful life.

---

## Step 21 — Monitor Performance

As analytics and reporting mature, monitor:

- Organic traffic
- Search impressions
- Search clicks
- Average search position
- Time on page
- Internal-link clicks
- Website Audit conversions
- Contact conversions
- Social referral traffic

The purpose is not only to determine whether an article received traffic.

The more important question is:

> Did the article attract the right audience and move them toward a business action?

---

# Content Funnel

The preferred JS Solutions content funnel is:

```text
Search / Social
      ↓
Blog Article
      ↓
Education + Trust
      ↓
Website Growth Audit
      ↓
Professional Report
      ↓
Lead
      ↓
Strategy Conversation
      ↓
Client
```

Not every article must point directly to the Website Growth Audit.

Each article should, however, support the broader customer journey.

---

# Quality Checklist

Before considering the article complete:

- [ ] Topic supports business or SEO strategy
- [ ] Primary keyword or topic defined
- [ ] Search intent is clear
- [ ] Target reader is clear
- [ ] Conversion goal defined
- [ ] Slug is clean
- [ ] Title is useful and descriptive
- [ ] Meta description is written
- [ ] Publish date is correct
- [ ] Reading time is set
- [ ] Article file created
- [ ] Article registered in `posts.tsx`
- [ ] Article provides meaningful value
- [ ] Heading structure is logical
- [ ] Internal links added
- [ ] Relevant CTA included
- [ ] Paid implementation details protected
- [ ] TypeScript passes
- [ ] Lint passes
- [ ] Production build passes
- [ ] Local article reviewed
- [ ] Git changes committed
- [ ] Git changes pushed
- [ ] Vercel deployment successful
- [ ] Production article reviewed
- [ ] Social promotion content created
- [ ] Supporting image concept created
- [ ] Article added to future content rotation

---

# Success Criteria

This playbook is complete when:

1. The article is live on the production JS Solutions website.
2. The article is registered through the existing blog architecture.
3. Relevant internal links and calls to action are present.
4. The article supports an identified SEO or business goal.
5. The production deployment is healthy.
6. Social promotion content has been prepared.
7. The article is available for reuse in future marketing.
8. The article supports the broader JS Solutions lead-generation funnel.

---

# Common Mistakes

Avoid:

- Publishing without a conversion goal
- Publishing isolated topics unrelated to the broader content strategy
- Forgetting to add the article to `posts.tsx`
- Forgetting internal links
- Overusing exact-match keywords
- Writing for search engines instead of business owners
- Giving away complete implementation procedures
- Pushing without running the build
- Promoting an article without checking the production URL
- Publishing once and never reusing the content
- Using vague anchor text such as "click here"
- Creating a blog simply because content has not been posted recently
- Publishing thin content to increase article count
- Repeating the same topic without adding meaningful value

---

# Troubleshooting

## Article Returns 404

Confirm:

1. The article file exists.
2. The article is imported into:

```text
src/content/blog/posts.tsx
```

3. The article is included in:

```tsx
blogPosts
```

4. The URL uses the exact article slug.

---

## Article Does Not Appear on `/blog`

Verify that the article exists in:

```tsx
export const blogPosts: BlogPost[]
```

Restart the development server if necessary:

```bash
npm run dev
```

---

## TypeScript Fails

Check:

- Export name
- Import name
- `BlogPost` fields
- JSX syntax
- `Link` imports
- Missing commas
- Invalid component syntax

Run:

```bash
npx tsc --noEmit
```

after correcting the issue.

---

## Lint Fails

Run:

```bash
npm run lint
```

Review the reported file and line.

Correct the issue before publishing.

---

## Production Build Fails

Run locally first:

```bash
npm run build
```

If the local build succeeds but Vercel fails, review:

```text
Vercel
    ↓
Project
    ↓
Deployments
    ↓
Failed Deployment
    ↓
Build Logs
```

Pay special attention to:

- Missing environment variables
- Missing imports
- Database configuration
- TypeScript failures
- Server-only code
- Build-time data access

---

# Related Documentation

See:

```text
docs/sops/marketing/
docs/seo/
docs/marketing/
docs/services/
docs/playbooks/create-facebook-post.md
```

Related source files:

```text
src/content/blog/
src/content/blog/posts.tsx
src/content/blog/types.ts
src/app/blog/page.tsx
src/app/blog/[slug]/page.tsx
```

---

# Related Playbooks

This playbook should connect directly to:

```text
docs/playbooks/create-facebook-post.md
docs/playbooks/monthly-seo.md
```

Future related playbooks may include:

```text
docs/playbooks/create-instagram-post.md
docs/playbooks/create-blog-graphic.md
docs/playbooks/update-existing-blog.md
docs/playbooks/perform-content-refresh.md
docs/playbooks/build-topic-cluster.md
```

---

# Revision History

## Version 1.0

Date: August 2026

Changes:

- Initial playbook created
- Documented current Next.js blog publishing workflow
- Added SEO preparation process
- Added content-quality standards
- Added internal linking process
- Added CTA strategy
- Added local validation
- Added Vercel production validation
- Added social promotion workflow
- Added content reuse guidance
- Added troubleshooting guidance

---

# Document Information

Owner: JS Solutions

Status: Active

Version: 1.0

Review Frequency: Quarterly or whenever the blog architecture changes