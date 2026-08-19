import { extractContactFormsFromHtml } from "./extract-forms";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const pageUrl = "https://example.com/contact";

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

const contactForms = extractContactFormsFromHtml(
  contactHtml,
  pageUrl,
  "WEBSITE_CONTACT_PAGE",
);

assert(contactForms.length === 1, "detects legitimate contact form");
assert(contactForms[0]?.detectedFields.hasMessage, "detects message field");
assert(contactForms[0]?.detectedFields.hasName, "detects name field");
assert(contactForms[0]?.detectedFields.hasEmail, "detects email field");
assert(contactForms[0]?.detectedFields.hasPhone, "detects phone field");
assert(
  contactForms[0]?.url === "https://example.com/submit-contact",
  "resolves relative form action URL",
);

const newsletterHtml = `
  <form class="newsletter-signup">
    <input type="email" name="email" />
    <button type="submit">Subscribe</button>
  </form>
`;

assert(
  extractContactFormsFromHtml(
    newsletterHtml,
    "https://example.com",
    "WEBSITE_HOMEPAGE",
  ).length === 0,
  "rejects newsletter form",
);

const searchHtml = `
  <form role="search">
    <input type="search" name="q" />
    <button type="submit">Search</button>
  </form>
`;

assert(
  extractContactFormsFromHtml(
    searchHtml,
    "https://example.com",
    "WEBSITE_HOMEPAGE",
  ).length === 0,
  "rejects search form",
);

const loginHtml = `
  <form action="/login">
    <input type="email" name="email" />
    <input type="password" name="password" />
    <button type="submit">Log in</button>
  </form>
`;

assert(
  extractContactFormsFromHtml(
    loginHtml,
    "https://example.com",
    "WEBSITE_HOMEPAGE",
  ).length === 0,
  "rejects login form",
);

const jobHtml = `
  <form action="/careers/apply">
    <input type="text" name="name" />
    <textarea name="cover_letter"></textarea>
    <button type="submit">Apply for job</button>
  </form>
`;

assert(
  extractContactFormsFromHtml(
    jobHtml,
    "https://example.com/careers",
    "WEBSITE_OTHER",
  ).length === 0,
  "rejects job application form",
);

const repeat = extractContactFormsFromHtml(
  contactHtml,
  pageUrl,
  "WEBSITE_CONTACT_PAGE",
);

assert(
  JSON.stringify(repeat) === JSON.stringify(contactForms),
  "deterministic output",
);

console.log("extract-forms.verify.ts passed");
