export const MAX_CONTACT_PAGES_PER_PROSPECT = 5;

export const MAX_CONTACT_DISCOVERY_PER_RUN = 10;

export const MAX_CONTACT_DISCOVERY_CONCURRENCY = 2;

export const CONTACT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const STALE_CONTACT_DISCOVERY_RUN_MS = 12 * 60 * 1000;

export const CONTACT_PAGE_FETCH_CONCURRENCY = 2;

export const CONSUMER_MAILBOX_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "ymail.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

export const REJECTED_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "test.com",
  "email.com",
  "domain.com",
  "yourdomain.com",
  "sentry.io",
  "wixpress.com",
  "wix.com",
  "myshopify.com",
  "shopify.com",
  "googleusercontent.com",
  "cloudflare.com",
  "w3.org",
  "schema.org",
  "jquery.com",
  "google-analytics.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "tiktok.com",
  "squarespace.com",
  "weebly.com",
  "godaddy.com",
  "wordpress.com",
]);

export const REJECTED_LOCAL_PARTS = new Set([
  "noreply",
  "no-reply",
  "no_reply",
  "donotreply",
  "do-not-reply",
  "mailer-daemon",
  "postmaster",
  "webmaster",
  "bounce",
  "mailer",
]);

export const IMAGE_OR_ASSET_TLDS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "ico",
  "css",
  "js",
  "map",
  "woff",
  "woff2",
  "ttf",
]);
