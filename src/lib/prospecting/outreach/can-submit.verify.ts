import { canSubmitContactFormMessage } from "./can-submit";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const approvedAt = new Date("2026-08-19T12:00:00.000Z");

const allowed = canSubmitContactFormMessage({
  message: {
    status: "APPROVED",
    channel: "CONTACT_FORM",
    approvedAt,
    approvedByEmail: "operator@example.com",
    bodyText: "Hello team,\n\nShort note.\n\nJosh",
    contactFormId: "form-1",
    prospectId: "p1",
    campaignId: "c1",
  },
  prospect: {
    qualificationStatus: "QUALIFIED",
    outreachStatus: "APPROVED",
    hostname: "example.com",
    leadId: null,
  },
  contactForm: {
    id: "form-1",
    isPrimary: true,
    status: "SELECTED",
    url: "https://example.com/contact",
    prospectId: "p1",
  },
  campaign: { status: "ACTIVE" },
  suppressedHostnames: new Set<string>(),
  customerHostnames: new Set<string>(),
  existingLead: false,
  priorSubmittedExists: false,
});

assert(allowed.allowed, "approved contact-form draft can be marked submitted");

assert(
  !canSubmitContactFormMessage({
    message: {
      status: "APPROVED",
      channel: "EMAIL",
      approvedAt,
      approvedByEmail: "operator@example.com",
      bodyText: "Hello",
      contactFormId: "form-1",
      prospectId: "p1",
      campaignId: "c1",
    },
    prospect: {
      qualificationStatus: "QUALIFIED",
      outreachStatus: "APPROVED",
      hostname: "example.com",
      leadId: null,
    },
    contactForm: {
      id: "form-1",
      isPrimary: true,
      status: "SELECTED",
      url: "https://example.com/contact",
      prospectId: "p1",
    },
    campaign: { status: "ACTIVE" },
    suppressedHostnames: new Set<string>(),
    customerHostnames: new Set<string>(),
    existingLead: false,
    priorSubmittedExists: false,
  }).allowed,
  "email channel cannot be marked submitted",
);

assert(
  !canSubmitContactFormMessage({
    message: {
      status: "DRAFT",
      channel: "CONTACT_FORM",
      approvedAt: null,
      approvedByEmail: null,
      bodyText: "Hello",
      contactFormId: "form-1",
      prospectId: "p1",
      campaignId: "c1",
    },
    prospect: {
      qualificationStatus: "QUALIFIED",
      outreachStatus: "DRAFT_READY",
      hostname: "example.com",
      leadId: null,
    },
    contactForm: {
      id: "form-1",
      isPrimary: true,
      status: "SELECTED",
      url: "https://example.com/contact",
      prospectId: "p1",
    },
    campaign: { status: "ACTIVE" },
    suppressedHostnames: new Set<string>(),
    customerHostnames: new Set<string>(),
    existingLead: false,
    priorSubmittedExists: false,
  }).allowed,
  "unapproved draft cannot be marked submitted",
);

assert(
  !canSubmitContactFormMessage({
    message: {
      status: "APPROVED",
      channel: "CONTACT_FORM",
      approvedAt,
      approvedByEmail: "operator@example.com",
      bodyText: "Hello",
      contactFormId: "form-1",
      prospectId: "p1",
      campaignId: "c1",
    },
    prospect: {
      qualificationStatus: "QUALIFIED",
      outreachStatus: "APPROVED",
      hostname: "example.com",
      leadId: "lead-1",
    },
    contactForm: {
      id: "form-1",
      isPrimary: true,
      status: "SELECTED",
      url: "https://example.com/contact",
      prospectId: "p1",
    },
    campaign: { status: "ACTIVE" },
    suppressedHostnames: new Set<string>(),
    customerHostnames: new Set<string>(),
    existingLead: false,
    priorSubmittedExists: false,
  }).allowed,
  "converted prospect blocked",
);

assert(
  !canSubmitContactFormMessage({
    message: {
      status: "APPROVED",
      channel: "CONTACT_FORM",
      approvedAt,
      approvedByEmail: "operator@example.com",
      bodyText: "Hello",
      contactFormId: "form-1",
      prospectId: "p1",
      campaignId: "c1",
    },
    prospect: {
      qualificationStatus: "QUALIFIED",
      outreachStatus: "APPROVED",
      hostname: "example.com",
      leadId: null,
    },
    contactForm: {
      id: "form-1",
      isPrimary: true,
      status: "SELECTED",
      url: "https://example.com/contact",
      prospectId: "p1",
    },
    campaign: { status: "ACTIVE" },
    suppressedHostnames: new Set(["example.com"]),
    customerHostnames: new Set<string>(),
    existingLead: false,
    priorSubmittedExists: false,
  }).allowed,
  "suppression rechecked before mark submitted",
);

assert(
  !canSubmitContactFormMessage({
    message: {
      status: "APPROVED",
      channel: "CONTACT_FORM",
      approvedAt,
      approvedByEmail: "operator@example.com",
      bodyText: "Hello",
      contactFormId: "form-1",
      prospectId: "p1",
      campaignId: "c1",
    },
    prospect: {
      qualificationStatus: "QUALIFIED",
      outreachStatus: "APPROVED",
      hostname: "example.com",
      leadId: null,
    },
    contactForm: {
      id: "form-1",
      isPrimary: true,
      status: "SELECTED",
      url: "https://example.com/contact",
      prospectId: "p1",
    },
    campaign: { status: "ACTIVE" },
    suppressedHostnames: new Set<string>(),
    customerHostnames: new Set<string>(),
    existingLead: false,
    priorSubmittedExists: true,
  }).allowed,
  "duplicate mark submitted blocked",
);

console.log("can-submit.verify.ts passed");
