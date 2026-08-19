import { canContactProspect } from "./can-contact";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  canContactProspect({
    hostname: "business.com",
    email: "office@business.com",
    suppressedHostnames: new Set(),
    suppressedEmails: new Set(),
    customerHostnames: new Set(),
    existingLead: false,
    contactStatus: "SELECTED",
  }).allowed,
  "clean contact is allowed",
);

const hostnameSuppressed = canContactProspect({
  hostname: "business.com",
  email: "office@business.com",
  suppressedHostnames: new Set(["business.com"]),
  suppressedEmails: new Set(),
  customerHostnames: new Set(),
  existingLead: false,
  contactStatus: "SELECTED",
});
assert(!hostnameSuppressed.allowed, "hostname suppression blocks contact");
assert(
  hostnameSuppressed.reasons.includes("HOSTNAME_SUPPRESSED"),
  "hostname suppression reason is explicit",
);

const emailSuppressed = canContactProspect({
  hostname: "business.com",
  email: "office@business.com",
  suppressedHostnames: new Set(),
  suppressedEmails: new Set(["office@business.com"]),
  customerHostnames: new Set(),
  existingLead: false,
  contactStatus: "SELECTED",
});
assert(!emailSuppressed.allowed, "email suppression blocks contact");
assert(emailSuppressed.reasons.includes("EMAIL_SUPPRESSED"), "email reason is explicit");

assert(
  !canContactProspect({
    hostname: "business.com",
    email: "office@business.com",
    suppressedHostnames: new Set(),
    suppressedEmails: new Set(),
    customerHostnames: new Set(),
    existingLead: true,
    contactStatus: "SELECTED",
  }).allowed,
  "existing lead blocks outreach",
);

assert(
  !canContactProspect({
    hostname: "business.com",
    email: null,
    suppressedHostnames: new Set(),
    suppressedEmails: new Set(),
    customerHostnames: new Set(),
    existingLead: false,
  }).allowed,
  "missing email is not guessed",
);

console.log("suppression.verify.ts passed");
