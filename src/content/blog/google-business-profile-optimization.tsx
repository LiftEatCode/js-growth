import Link from "next/link";

import type { BlogPost } from "./types";

export const googleBusinessProfileOptimizationPost: BlogPost = {
  slug: "google-business-profile-optimization",
  title: "How to Optimize Your Google Business Profile",
  description: "A practical Google Business Profile guide for local repair shops, contractors, and fabricators.",
  category: "SEO",
  publishedAt: "November 15, 2026",
  publishedAtIso: "2026-11-15",
  readingTime: "4 min read",
  content: (
    <>
      <p>
        A customer looking for trailer repair wants to know if you handle their job, whether you
        serve their area, and how to reach you. Open your own listing on a phone and see how quickly
        you can answer those questions.
      </p>
      <h2>Confirm ownership and check the basics</h2>
      <p>
        Sign in with the account that manages the verified profile. Compare the public business name,
        phone, hours, and website with what customers actually use. If your listing is missing, start
        with the <Link href="/blog/small-business-not-showing-up-on-google">Google visibility troubleshooting guide</Link>.
      </p>
      <h2>Describe the work customers can hire you for</h2>
      <p>
        Choose the most specific available primary category that fits your main business. Review your
        services and add plain-language descriptions of the work you actually take on. Add current
        photos of your storefront or completed jobs that you have permission to share.
      </p>
      <h2>Test the handoff to your website</h2>
      <p>
        Tap the website link in your listing. Make sure the page loads, explains your main services,
        and gives customers a clear way to call or request a quote. If the usual job starts with a
        photo and ZIP code, tell customers that before they open the form.
      </p>
      <h2>Respond to reviews and track inquiries</h2>
      <p>
        Reply to reviews without sharing customer or job details that belong in private. Record your
        profile changes and compare website clicks and inquiries over time. Google describes relevance,
        distance, and prominence as the main factors in local results.{" "}
        <a href="https://support.google.com/business/answer/7091">Read Google’s local ranking guidance</a>.
      </p>
      <p>
        Use our <Link href="/blog/local-seo-checklist-small-business">local SEO checklist</Link> for the
        rest of your site, or <Link href="/free-check">request a free website and Google profile check</Link>.
      </p>
    </>
  ),
};
