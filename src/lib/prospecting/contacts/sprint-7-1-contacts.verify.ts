import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { selectProspectOutreachChannel } from "./select-channel";
import {
  buildWebsiteFetchCandidates,
  extractGoogleSitesContinueUrl,
  isGoogleAccountsLoginUrl,
} from "./fetch-page";
import {
  dedupeExtractedContactForms,
  extractContactFormsFromHtml,
} from "./extract-forms";
import { isReusableContactDiscovery } from "./limit";
import { rankContactLink, rankContactPage, selectContactPagesToFetch } from "./pages";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const contactHtml = `
  <html><body>
    <h1>Contact us</h1>
    <form action="/submit-contact" method="post">
      <input type="text" name="name" placeholder="Your name" />
      <input type="email" name="email" />
      <input type="tel" name="phone" />
      <textarea name="message"></textarea>
      <button type="submit">Send message</button>
    </form>
  </body></html>
`;

assert(
  extractContactFormsFromHtml(contactHtml, "https://example.com/contact", "WEBSITE_CONTACT_PAGE").length === 1,
  "traditional contact form detected",
);

const requestServiceHtml = `
  <form action="/request-service" method="post" class="service-request-form">
    <input name="customer_name" placeholder="Your name" />
    <input type="tel" name="phone" />
    <textarea name="service_details"></textarea>
    <button type="submit">Request Service</button>
  </form>
`;

assert(
  extractContactFormsFromHtml(
    requestServiceHtml,
    "https://example.com/request-service",
    "WEBSITE_CONTACT_PAGE",
  ).length === 1,
  "request-service form detected",
);

const estimateHtml = `
  <form action="/free-estimate">
    <input name="first_name" />
    <input name="last_name" />
    <input type="email" name="email" />
    <textarea name="project_description"></textarea>
    <input type="submit" value="Request Estimate" />
  </form>
`;

assert(
  extractContactFormsFromHtml(
    estimateHtml,
    "https://example.com/free-estimate",
    "WEBSITE_CONTACT_PAGE",
  ).length === 1,
  "request-estimate form detected",
);

const elementorHtml = `
  <form class="elementor-form" method="post">
    <input name="form_fields[name]" placeholder="Full Name" />
    <input type="tel" name="form_fields[email]" placeholder="Phone Number" />
    <input type="email" name="form_fields[message]" placeholder="Email" />
    <textarea name="form_fields[field_6401cf8]" placeholder="Describe your problem"></textarea>
    <button type="submit">Submit</button>
  </form>
`;

assert(
  extractContactFormsFromHtml(
    elementorHtml,
    "https://happyplumbingllc.com/",
    "WEBSITE_HOMEPAGE",
  ).length === 1,
  "elementor homepage form detected",
);

const iframeHtml = `
  <iframe src="https://form.jotform.com/123456789/contact-us" title="Contact form"></iframe>
`;

assert(
  extractContactFormsFromHtml(
    iframeHtml,
    "https://example.com/contact",
    "WEBSITE_CONTACT_PAGE",
  ).length === 1,
  "iframe provider form detected",
);

assert(
  extractContactFormsFromHtml(
    `<form class="newsletter-signup"><input type="email" name="email" /><button type="submit">Subscribe</button></form>`,
    "https://example.com",
    "WEBSITE_HOMEPAGE",
  ).length === 0,
  "newsletter rejected",
);

assert(
  extractContactFormsFromHtml(
    `<form role="search"><input type="search" name="q" /><button type="submit">Search</button></form>`,
    "https://example.com",
    "WEBSITE_HOMEPAGE",
  ).length === 0,
  "search rejected",
);

assert(
  extractContactFormsFromHtml(
    `<form action="/login"><input type="password" name="password" /><button>Log in</button></form>`,
    "https://example.com",
    "WEBSITE_HOMEPAGE",
  ).length === 0,
  "login rejected",
);

assert(
  extractContactFormsFromHtml(
    `<form action="/careers/apply"><textarea name="cover_letter"></textarea><button>Apply for job</button></form>`,
    "https://example.com/careers",
    "WEBSITE_OTHER",
  ).length === 0,
  "careers rejected",
);

assert(rankContactPage("https://www.roaelectric.com/contact-3") === 100, "contact-3 ranked");
assert(
  rankContactLink({
    href: "https://example.com/get-started",
    anchorText: "Request Service",
  }) === 85,
  "anchor text ranks contact CTA",
);

const pages = selectContactPagesToFetch({
  homepageUrl: "https://www.roaelectric.com/",
  linkedHrefs: [
    "https://www.roaelectric.com/contact-3",
    "https://www.roaelectric.com/about",
  ],
  linkedCandidates: [
    { href: "https://www.roaelectric.com/contact-3", anchorText: "CONTACT" },
  ],
});
assert(
  pages.some((page) => page.href.includes("/contact-3")),
  "contact-3 page selected via anchor text",
);

assert(
  buildWebsiteFetchCandidates("https://www.example.com/page").length === 2,
  "www/apex fetch candidates generated",
);

const googleLogin =
  "https://accounts.google.com/v3/signin/identifier?continue=https://sites.google.com/view/high-point-ac-heating";
assert(isGoogleAccountsLoginUrl(googleLogin), "google login detected");
assert(
  extractGoogleSitesContinueUrl(googleLogin) ===
    "https://sites.google.com/view/high-point-ac-heating",
  "google continue url extracted",
);

assert(
  !isReusableContactDiscovery({
    lastContactDiscoveryAt: new Date(),
    outreachStatus: "NO_CONTACT",
    hasUsableContact: false,
    hasUsableForm: false,
  }),
  "stale zero-channel results are not reused",
);

assert(
  !isReusableContactDiscovery({
    lastContactDiscoveryAt: new Date(),
    outreachStatus: "CONTACT_FOUND",
    hasUsableContact: true,
    hasUsableForm: false,
  }),
  "email-only results rerun to discover forms",
);

assert(
  isReusableContactDiscovery({
    lastContactDiscoveryAt: new Date(),
    outreachStatus: "CONTACT_FOUND",
    hasUsableContact: true,
    hasUsableForm: true,
  }),
  "email+form fresh results reuse",
);

const channel = selectProspectOutreachChannel({
  hostname: "example.com",
  leadId: null,
  outreachStatus: "CONTACT_FOUND",
  contacts: [
    {
      id: "c1",
      email: "info@example.com",
      normalizedEmail: "info@example.com",
      status: "SELECTED",
      isPrimary: true,
    },
  ],
  contactForms: [
    {
      id: "f1",
      url: "https://example.com/contact",
      normalizedUrl: "https://example.com/contact",
      status: "DISCOVERED",
      isPrimary: false,
    },
  ],
  suppressedHostnames: new Set(),
  suppressedEmails: new Set(),
  customerHostnames: new Set(),
  existingLead: false,
});

assert(channel.type === "EMAIL", "email remains preferred when both exist");

const emailSuppressed = selectProspectOutreachChannel({
  hostname: "example.com",
  leadId: null,
  outreachStatus: "CONTACT_FOUND",
  contacts: [
    {
      id: "c1",
      email: "info@example.com",
      normalizedEmail: "info@example.com",
      status: "SUPPRESSED",
      isPrimary: true,
    },
  ],
  contactForms: [
    {
      id: "f1",
      url: "https://example.com/contact",
      normalizedUrl: "https://example.com/contact",
      status: "DISCOVERED",
      isPrimary: true,
    },
  ],
  suppressedHostnames: new Set(),
  suppressedEmails: new Set(["info@example.com"]),
  customerHostnames: new Set(),
  existingLead: false,
});

assert(
  emailSuppressed.type === "CONTACT_FORM",
  "form available after email-only bounce suppression",
);

const hostnameBlocked = selectProspectOutreachChannel({
  hostname: "example.com",
  leadId: null,
  outreachStatus: "SUPPRESSED",
  contacts: [
    {
      id: "c1",
      email: "info@example.com",
      normalizedEmail: "info@example.com",
      status: "SELECTED",
      isPrimary: true,
    },
  ],
  contactForms: [
    {
      id: "f1",
      url: "https://example.com/contact",
      normalizedUrl: "https://example.com/contact",
      status: "DISCOVERED",
      isPrimary: true,
    },
  ],
  suppressedHostnames: new Set(["example.com"]),
  suppressedEmails: new Set(),
  customerHostnames: new Set(),
  existingLead: false,
});

assert(hostnameBlocked.type === "NONE", "hostname suppression blocks both");

const deduped = dedupeExtractedContactForms([
  {
    url: "https://example.com/contact",
    normalizedUrl: "https://example.com/contact",
    sourcePageUrl: "https://example.com/contact",
    formMethod: "post",
    formAction: "/contact",
    detectedFields: {
      hasName: true,
      hasEmail: true,
      hasPhone: false,
      hasSubject: false,
      hasMessage: true,
    },
    confidence: "LOW",
    confidenceReason: "low",
  },
  {
    url: "https://example.com/contact/",
    normalizedUrl: "https://example.com/contact",
    sourcePageUrl: "https://example.com/contact",
    formMethod: "post",
    formAction: "/contact",
    detectedFields: {
      hasName: true,
      hasEmail: true,
      hasPhone: true,
      hasSubject: false,
      hasMessage: true,
    },
    confidence: "HIGH",
    confidenceReason: "high",
  },
]);

assert(deduped.length === 1 && deduped[0]?.confidence === "HIGH", "duplicate forms deduped");

const here = dirname(fileURLToPath(import.meta.url));
const websiteProvider = readFileSync(join(here, "./website-provider.ts"), "utf8");
const discoverSource = readFileSync(join(here, "./discover.ts"), "utf8");
const extractSource = readFileSync(join(here, "./extract-forms.ts"), "utf8");

assert(!websiteProvider.includes("openai"), "no OpenAI in form discovery");
assert(!websiteProvider.includes("google-places"), "no Google Places in form discovery");
assert(!websiteProvider.includes("resend"), "no Resend in form discovery");
assert(!extractSource.includes("playwright"), "no headless browser in form detection");
assert(discoverSource.includes("persistDiscoveredContactForms"), "forms persist alongside email");
assert(
  discoverSource.includes("live.length > 0 && liveForms.length > 0"),
  "multi-channel success messaging",
);

console.log("sprint-7-1-contacts.verify.ts passed");
