import { selectProspectOutreachChannel } from "./select-channel";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const base = {
  hostname: "example.com",
  leadId: null,
  outreachStatus: "CONTACT_FOUND",
  suppressedHostnames: new Set<string>(),
  suppressedEmails: new Set<string>(),
  customerHostnames: new Set<string>(),
  existingLead: false,
};

const emailPreferred = selectProspectOutreachChannel({
  ...base,
  contacts: [
    {
      id: "c1",
      email: "owner@example.com",
      normalizedEmail: "owner@example.com",
      status: "SELECTED",
      isPrimary: true,
    },
  ],
  contactForms: [
    {
      id: "f1",
      url: "https://example.com/contact",
      normalizedUrl: "https://example.com/contact",
      status: "SELECTED",
      isPrimary: true,
    },
  ],
});

assert(emailPreferred.type === "EMAIL", "email preferred over contact form");

const formOnly = selectProspectOutreachChannel({
  ...base,
  contacts: [],
  contactForms: [
    {
      id: "f1",
      url: "https://example.com/contact",
      normalizedUrl: "https://example.com/contact",
      status: "SELECTED",
      isPrimary: true,
    },
  ],
});

assert(formOnly.type === "CONTACT_FORM", "form used when no email");

const none = selectProspectOutreachChannel({
  ...base,
  contacts: [],
  contactForms: [],
});

assert(none.type === "NONE", "none when neither channel exists");

const suppressed = selectProspectOutreachChannel({
  ...base,
  suppressedHostnames: new Set(["example.com"]),
  contacts: [
    {
      id: "c1",
      email: "owner@example.com",
      normalizedEmail: "owner@example.com",
      status: "SELECTED",
      isPrimary: true,
    },
  ],
  contactForms: [
    {
      id: "f1",
      url: "https://example.com/contact",
      normalizedUrl: "https://example.com/contact",
      status: "SELECTED",
      isPrimary: true,
    },
  ],
});

assert(suppressed.type === "NONE", "hostname suppression overrides both channels");

const converted = selectProspectOutreachChannel({
  ...base,
  leadId: "lead-1",
  outreachStatus: "CONVERTED",
  contacts: [
    {
      id: "c1",
      email: "owner@example.com",
      normalizedEmail: "owner@example.com",
      status: "SELECTED",
      isPrimary: true,
    },
  ],
  contactForms: [],
});

assert(converted.type === "NONE", "converted lead overrides both channels");

console.log("select-channel.verify.ts passed");
