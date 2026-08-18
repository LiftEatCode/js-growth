import { normalizeProspectWebsite } from "./hostname";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertHost(input: string, expected: string, message: string): void {
  const result = normalizeProspectWebsite(input);
  assert(result.success, `${message}: expected success for ${input}`);
  if (result.success) {
    assert(
      result.hostname === expected,
      `${message}: expected ${expected}, got ${result.hostname}`,
    );
  }
}

assertHost("https://www.example.com/", "example.com", "www stripped");
assertHost("https://example.com", "example.com", "protocol kept, host returned");
assertHost("http://example.com/about", "example.com", "path removed");
assertHost(
  "https://www.example.com/a/b?c=1#hash",
  "example.com",
  "query and hash ignored",
);

const a = normalizeProspectWebsite("https://www.example.com/");
const b = normalizeProspectWebsite("http://example.com/about");
assert(a.success && b.success && a.hostname === b.hostname, "equivalent URLs");

const local = normalizeProspectWebsite("http://127.0.0.1");
assert(!local.success, "loopback rejected");

const privateNet = normalizeProspectWebsite("https://10.1.2.3");
assert(!privateNet.success, "private network rejected");

console.log("hostname.verify.ts passed");
