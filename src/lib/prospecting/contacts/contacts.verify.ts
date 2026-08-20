import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MAX_CONTACT_DISCOVERY_CONCURRENCY,
  MAX_CONTACT_DISCOVERY_PER_RUN,
  MAX_CONTACT_PAGES_PER_PROSPECT,
  CONTACT_TTL_MS,
} from "./constants";
import {
  dedupeExtractedEmails,
  extractEmailsFromHtml,
  isRejectedContactEmail,
  normalizeEmailAddress,
} from "./extract";
import { clampContactDiscoveryBatchSize, isReusableContactDiscovery } from "./limit";
import { normalizeContactCandidates } from "./normalize";
import { classifyContactPage, selectContactPagesToFetch } from "./pages";
import { selectPrimaryContact } from "./select";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const homepageHtml = `
<html>
  <body>
    <a href="mailto:Office@Business.com">Office</a>
    <a href="/contact">Contact us</a>
    <a href="https://vendor.example/about">External about</a>
    <p>Call us or email hello@business.com</p>
    <script>var leak = "noreply@sentry.io";</script>
  </body>
</html>
`;

const contactHtml = `
<html>
  <body>
    <a href="mailto:office@business.com">Email the office</a>
    <p>Also reach us at businessname@gmail.com</p>
    <p>Ignore test@example.com and noreply@business.com</p>
    <img alt="logo@2x.png" />
  </body>
</html>
`;

assert(normalizeEmailAddress("mailto:Office@Business.com?subject=Hi") === "office@business.com", "mailto query stripped");
assert(normalizeEmailAddress("  HELLO@Business.COM ") === "hello@business.com", "email lowercased");
assert(isRejectedContactEmail("noreply@business.com"), "noreply rejected");
assert(isRejectedContactEmail("test@example.com"), "example.com rejected");
assert(isRejectedContactEmail("logo@2x.png"), "image filename rejected");
assert(!isRejectedContactEmail("info@business.com"), "role account accepted");
assert(!isRejectedContactEmail("office@business.com"), "office@ accepted");

const homepageEmails = extractEmailsFromHtml(
  homepageHtml,
  "https://www.business.com/",
  "WEBSITE_HOMEPAGE",
);
assert(
  homepageEmails.some((row) => row.normalizedEmail === "office@business.com" && row.viaMailto),
  "mailto extracted from homepage",
);
assert(
  homepageEmails.some((row) => row.normalizedEmail === "hello@business.com"),
  "visible email extracted",
);
assert(
  !homepageEmails.some((row) => row.normalizedEmail === "noreply@sentry.io"),
  "script email ignored",
);

const contactEmails = extractEmailsFromHtml(
  contactHtml,
  "https://www.business.com/contact",
  "WEBSITE_CONTACT_PAGE",
);
assert(
  contactEmails.some((row) => row.normalizedEmail === "businessname@gmail.com"),
  "first-party gmail accepted",
);
assert(
  !contactEmails.some((row) => row.normalizedEmail === "test@example.com"),
  "test address rejected",
);
assert(
  !contactEmails.some((row) => row.normalizedEmail.includes("noreply")),
  "noreply on contact page rejected",
);

const combined = dedupeExtractedEmails([...homepageEmails, ...contactEmails]);
assert(
  combined.filter((row) => row.normalizedEmail === "office@business.com").length === 1,
  "duplicate emails collapse",
);

const normalized = normalizeContactCandidates(combined, "business.com");
const office = normalized.find((row) => row.normalizedEmail === "office@business.com");
const gmail = normalized.find((row) => row.normalizedEmail === "businessname@gmail.com");
assert(office?.confidence === "HIGH", "matching domain is high confidence");
assert(office?.sourceUrl.includes("business.com"), "source URL preserved");
assert(gmail?.confidence === "MEDIUM", "published gmail is medium, not rejected");

assert(
  classifyContactPage("https://www.business.com/", "https://www.business.com/") ===
    "WEBSITE_HOMEPAGE",
  "homepage classified",
);
assert(
  classifyContactPage("https://www.business.com/contact", "https://www.business.com/") ===
    "WEBSITE_CONTACT_PAGE",
  "contact page classified",
);

const pages = selectContactPagesToFetch({
  homepageUrl: "https://www.business.com/",
  linkedHrefs: [
    "https://www.business.com/contact",
    "https://www.business.com/about",
    "https://www.business.com/team",
    "https://www.business.com/staff",
    "https://www.business.com/our-team",
    "https://other.example/contact",
    "https://www.business.com/blog/hello",
  ],
});
assert(pages.length <= MAX_CONTACT_PAGES_PER_PROSPECT, "max 5 pages");
assert(pages[0]?.sourceType === "WEBSITE_HOMEPAGE", "homepage counts toward cap");
assert(
  pages.every((page) => page.href.includes("business.com")),
  "same-host only",
);
assert(
  !pages.some((page) => page.href.includes("other.example")),
  "external links are not crawled",
);
assert(
  !pages.some((page) => page.href.includes("/blog/")),
  "arbitrary pages are not crawled",
);

const primary = selectPrimaryContact(normalized);
assert(primary?.normalizedEmail === "office@business.com", "contact-page business email wins");

assert(clampContactDiscoveryBatchSize(40) === MAX_CONTACT_DISCOVERY_PER_RUN, "batch cap 10");
assert(MAX_CONTACT_DISCOVERY_CONCURRENCY === 2, "concurrency is 2");
assert(CONTACT_TTL_MS === 30 * 24 * 60 * 60 * 1000, "contact TTL is 30 days");
assert(
  !isReusableContactDiscovery({
    lastContactDiscoveryAt: new Date(),
    outreachStatus: "NO_CONTACT",
    hasUsableContact: false,
    hasUsableForm: false,
  }),
  "zero-channel results are rediscovered on batch find",
);
assert(
  !isReusableContactDiscovery({
    lastContactDiscoveryAt: new Date(Date.now() - CONTACT_TTL_MS - 1000),
    outreachStatus: "CONTACT_FOUND",
    hasUsableContact: true,
    hasUsableForm: true,
  }),
  "expired contacts are not reused",
);

const empty = extractEmailsFromHtml(
  "<html><body><p>Call us today</p></body></html>",
  "https://www.business.com/",
  "WEBSITE_HOMEPAGE",
);
assert(empty.length === 0, "does not guess an email when none exists");

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, files);
    } else if (extname(full) === ".ts" || extname(full) === ".tsx") {
      files.push(full);
    }
  }
  return files;
}

const here = dirname(fileURLToPath(import.meta.url));
const contactFiles = walk(here).filter((file) => !file.endsWith(".verify.ts"));
for (const file of contactFiles) {
  const source = readFileSync(file, "utf8");
  assert(!source.includes("info@${"), `${file} must not guess info@`);
  assert(!source.includes("contact@${"), `${file} must not guess contact@`);
  assert(!source.includes("owner@${"), `${file} must not guess owner@`);
}

const actions = readFileSync(
  join(here, "../../../app/reports/prospecting/contact-actions.ts"),
  "utf8",
);
assert(actions.includes("getInternalSession"), "contact discovery requires session");
assert(!actions.includes("google-places"), "contact discovery does not call Google Places");
assert(!actions.includes("resend"), "contact discovery does not send email");
assert(!actions.includes("runDeterministicWebsiteAudit"), "contact discovery does not audit");

console.log("contacts.verify.ts passed");
