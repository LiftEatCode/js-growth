/**
 * Bounded multi-page crawl limits for Website Growth Audit.
 *
 * This is a representative / prioritized site scan, not a complete crawler.
 * Do not hard-code these values inside loops.
 */

export const MAX_CRAWLED_PAGES = 12;
export const MAX_CRAWL_DEPTH = 2;
export const MAX_DISCOVERED_URLS = 100;
export const MAX_BLOG_PAGES = 2;
export const SITE_FETCH_CONCURRENCY = 3;
export const MAX_SITE_CRAWL_MS = 25_000;

export const MAX_SITEMAP_LOC_CANDIDATES = 80;
export const MAX_SITEMAP_BODY_BYTES = 256 * 1024;
export const MAX_QUERY_PARAMS = 3;
export const MAX_SKIPPED_URLS_RECORDED = 40;
export const MAX_OUTGOING_PATHS_STORED = 24;
export const MAX_CONTENT_TOKENS_STORED = 80;
export const SITE_FINDING_EXAMPLE_CAP = 5;
export const JACCARD_SIMILARITY_THRESHOLD = 0.85;
export const MIN_CONTENT_TOKENS_FOR_SIMILARITY = 40;

export const SITE_SCAN_DISCLOSURE =
  "This audit scans a prioritized sample of important pages and may not include every URL on the website.";

export const TRACKING_QUERY_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "_ga",
  "dclid",
  "ttclid",
]);

export const SESSION_OR_FACET_QUERY_PARAMS = new Set([
  "jsessionid",
  "phpsessid",
  "sid",
  "sessionid",
  "session_id",
  "filter",
  "filters",
  "sort",
  "order",
  "orderby",
  "min_price",
  "max_price",
]);

export const PAGINATION_QUERY_PARAMS = new Set([
  "page",
  "paged",
  "start",
  "offset",
]);

export const FILE_EXTENSIONS_TO_SKIP = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "zip",
  "gz",
  "rar",
  "7z",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "avif",
  "ico",
  "bmp",
  "mp4",
  "webm",
  "mov",
  "avi",
  "mp3",
  "wav",
  "ogg",
  "css",
  "js",
  "mjs",
  "map",
  "json",
  "rss",
  "atom",
  "woff",
  "woff2",
  "ttf",
  "eot",
]);

export const UTILITY_PATH_SEGMENTS = new Set([
  "privacy",
  "privacy-policy",
  "terms",
  "terms-of-service",
  "terms-and-conditions",
  "refund",
  "refund-policy",
  "cookie",
  "cookies",
  "cookie-policy",
  "legal",
  "login",
  "signin",
  "sign-in",
  "signup",
  "sign-up",
  "register",
  "cart",
  "basket",
  "checkout",
  "search",
  "tag",
  "tags",
  "author",
  "authors",
  "feed",
  "wp-json",
  "wp-admin",
  "wp-login",
  "xmlrpc.php",
  "admin",
  "account",
  "my-account",
  "wishlist",
  "compare",
  "trackback",
  "comments",
  "cdn-cgi",
]);

export const LANGUAGE_PATH_SEGMENTS = new Set([
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "ru",
  "ja",
  "ko",
  "zh",
  "ar",
  "hi",
  "tr",
  "sv",
  "da",
  "fi",
  "no",
  "cs",
  "hu",
  "ro",
  "uk",
  "vi",
  "th",
  "id",
  "he",
]);
