import {
  interpretPublicWebsiteUrl,
  parsePublicWebsiteUrl,
  parseWebsiteAuditInput,
} from "./schema";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertRejected(
  input: string,
  needle: string,
  message: string,
): void {
  let thrown = false;

  try {
    const parsed = parseWebsiteAuditInput({ url: input });
    assert(!parsed.success, `${message}: expected failure`);
    assert(
      parsed.success === false && parsed.error.toLowerCase().includes(needle),
      `${message}: expected customer-safe error containing "${needle}", got ${
        parsed.success === false ? parsed.error : "success"
      }`,
    );
    assert(
      parsed.success === false &&
        !parsed.error.toLowerCase().includes("invalid url"),
      `${message}: must not leak URL parser errors`,
    );
  } catch (error) {
    thrown = true;
    throw new Error(
      `${message}: threw instead of returning a validation result (${
        error instanceof Error ? error.message : "unknown"
      })`,
    );
  }

  assert(!thrown, `${message}: must not throw`);
}

function assertAccepted(input: string, expectedHost: string, message: string): void {
  const parsed = parseWebsiteAuditInput({ url: input });
  assert(parsed.success, `${message}: expected success`);
  if (!parsed.success) {
    return;
  }

  const url = new URL(parsed.data.url);
  assert(url.protocol === "https:" || url.protocol === "http:", `${message}: http(s)`);
  assert(url.hostname === expectedHost, `${message}: hostname ${url.hostname}`);
}

assertAccepted("example.com", "example.com", "bare domain normalizes");
assertAccepted("https://example.com", "example.com", "https URL is accepted");
assertAccepted(
  "https://example.com/path?q=1",
  "example.com",
  "https URL with path is accepted",
);

const example = parsePublicWebsiteUrl("example.com");
assert(example.success && example.url === "https://example.com/", "bare domain becomes https");

assertRejected("not a url", "valid website url", "malformed text");
assertRejected("ftp://example.com", "http and https", "ftp is rejected");
assertRejected("javascript:alert(1)", "http and https", "javascript: is rejected");
assertRejected("javascript:", "http and https", "javascript: scheme is rejected");
assertRejected("data:text/html,hello", "http and https", "data: is rejected");
assertRejected("file:///etc/passwd", "http and https", "file: is rejected");
assertRejected("localhost", "private and local", "localhost hostname");
assertRejected("http://localhost", "private and local", "localhost URL");
assertRejected("127.0.0.1", "private and local", "loopback host");
assertRejected("http://127.0.0.1", "private and local", "loopback URL");
assertRejected("10.0.0.5", "private and local", "RFC1918 10/8");
assertRejected("https://10.1.2.3", "private and local", "RFC1918 10/8 URL");
assertRejected("192.168.1.20", "private and local", "RFC1918 192.168/16");
assertRejected("http://192.168.0.1", "private and local", "RFC1918 192.168/16 URL");
assertRejected("172.16.0.1", "private and local", "RFC1918 172.16/12 start");
assertRejected("https://172.31.255.1", "private and local", "RFC1918 172.16/12 end");

const ftpNormalize = interpretPublicWebsiteUrl("ftp://example.com");
assert(!ftpNormalize.success, "ftp is not rewritten into https");
assert(
  !ftpNormalize.success && !ftpNormalize.error.includes("ftp//example.com"),
  "ftp rejection does not produce a garbage https URL",
);

console.log("website URL schema verification passed");
process.exit(0);
