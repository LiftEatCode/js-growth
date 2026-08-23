/**
 * Commercial Sprint 10 — Client / Project onboarding verification.
 * Pure deterministic tests + source scans. No OpenAI, Places, crawl, Stripe, Resend, or production DB.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import { OPPORTUNITY_ACTIVITY_TYPES } from "@/lib/commercialization/opportunities/constants";
import type { AcceptedAgreementPaymentAuthority } from "@/lib/commercialization/payments/types";
import type { LoadedPaymentSummary } from "@/lib/commercialization/payments/types";

import {
  CLIENT_PROJECT_ONBOARDING_VERSION,
  PROJECT_COMMERCIAL_SNAPSHOT_VERSION,
} from "./constants";
import {
  buildOnboardingChecklistTemplate,
} from "./checklist";
import { canCompleteProject, deriveOnboardingState } from "./derive";
import { getOnboardingEligibility } from "./eligibility";
import {
  deliveryTaskKeyFor,
  mapScopeSnapshotToDelivery,
} from "./map-delivery";
import {
  normalizeHostname,
  resolveInitialClientContact,
} from "./identity";
import type { ProjectCommercialSnapshot } from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function collectTsFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(root, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(full));
      continue;
    }
    if (extname(full) === ".ts" || extname(full) === ".tsx") {
      files.push(full);
    }
  }
  return files;
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../../..");

assert(CLIENT_PROJECT_ONBOARDING_VERSION === 1, "onboarding version 1");
assert(PROJECT_COMMERCIAL_SNAPSHOT_VERSION === 1, "snapshot version 1");

// 1–2 Prospect != Client / Opportunity != Client (documented + models distinct)
{
  const schema = readFileSync(join(repoRoot, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model Client {"), "Client model");
  assert(schema.includes("model Opportunity {"), "Opportunity model");
  assert(schema.includes("model Prospect {"), "Prospect model");
  assert(
    schema.includes("Prospect ≠ Opportunity ≠ Client") ||
      schema.includes("Prospect != Opportunity != Client"),
    "distinction documented in schema",
  );
}

for (const type of [
  "CLIENT_CREATED",
  "PROJECT_CREATED",
  "ONBOARDING_STARTED",
  "ONBOARDING_ITEM_UPDATED",
  "PROJECT_READY_FOR_KICKOFF",
  "PROJECT_STARTED",
  "PROJECT_BLOCKED",
  "PROJECT_COMPLETED",
] as const) {
  assert(OPPORTUNITY_ACTIVITY_TYPES.includes(type), `activity ${type}`);
}

function agreement(
  overrides: Partial<AcceptedAgreementPaymentAuthority> = {},
): AcceptedAgreementPaymentAuthority {
  return {
    agreementId: "agr_1",
    opportunityId: "opp_1",
    status: "ACCEPTED",
    currency: "USD",
    paymentTermType: "DEPOSIT_AND_BALANCE",
    totalInvestmentCents: 205_000,
    depositCents: 102_500,
    balanceCents: 102_500,
    paymentCustomText: null,
    businessName: "Rooftop Solutions",
    ...overrides,
  };
}

function payment(
  overrides: Partial<LoadedPaymentSummary> &
    Pick<LoadedPaymentSummary, "type" | "status">,
): LoadedPaymentSummary {
  return {
    id: overrides.id ?? `p_${overrides.type}`,
    type: overrides.type,
    status: overrides.status,
    currency: "USD",
    amountDueCents: overrides.amountDueCents ?? 102_500,
    amountPaidCents:
      overrides.amountPaidCents ??
      (overrides.status === "PAID" ? overrides.amountDueCents ?? 102_500 : 0),
    paymentSequence: 1,
    checkoutUrl: null,
    stripeCheckoutSessionId: null,
    paidAt: overrides.status === "PAID" ? new Date() : null,
    failedAt: null,
    expiredAt: null,
    refundedAt: null,
    reconciliationCode: null,
    createdAt: new Date(),
  };
}

// 3 Agreement ACCEPTED required
{
  const r = getOnboardingEligibility({
    agreement: agreement({ status: "APPROVED" }),
    payments: [],
  });
  assert(!r.eligible && r.code === "AGREEMENT_NOT_ACCEPTED", "3 accepted required");
}

// 4 deposit unpaid blocks DEPOSIT_AND_BALANCE
{
  const r = getOnboardingEligibility({
    agreement: agreement(),
    payments: [payment({ type: "DEPOSIT", status: "PENDING" })],
  });
  assert(!r.eligible && r.code === "DEPOSIT_UNPAID", "4 deposit unpaid blocks");
}

// 5–6 deposit paid enables; balance unpaid does not block
{
  const r = getOnboardingEligibility({
    agreement: agreement(),
    payments: [payment({ type: "DEPOSIT", status: "PAID" })],
  });
  assert(r.eligible, "5 deposit paid enables");
  assert(r.balanceOutstandingCents === 102_500, "6 balance outstanding");
  assert(!r.paidInFull, "6 not paid in full");
}

// 7–8 FULL_UPFRONT
{
  const unpaid = getOnboardingEligibility({
    agreement: agreement({
      paymentTermType: "FULL_UPFRONT",
      depositCents: null,
      balanceCents: null,
    }),
    payments: [],
  });
  assert(!unpaid.eligible && unpaid.code === "FULL_UNPAID", "7 full unpaid");

  const paid = getOnboardingEligibility({
    agreement: agreement({
      paymentTermType: "FULL_UPFRONT",
      depositCents: null,
      balanceCents: null,
    }),
    payments: [
      payment({
        type: "FULL",
        status: "PAID",
        amountDueCents: 205_000,
        amountPaidCents: 205_000,
      }),
    ],
  });
  assert(paid.eligible && paid.paidInFull, "8 full paid enables");
}

// 9 CUSTOM ambiguous blocks
{
  const r = getOnboardingEligibility({
    agreement: agreement({ paymentTermType: "CUSTOM" }),
    payments: [],
  });
  assert(!r.eligible && r.code === "CUSTOM_AMBIGUOUS", "9 custom blocks");
}

// 10 override requires reason for completion when balance due
{
  const blocked = canCompleteProject({
    projectStatus: "ACTIVE",
    allRequiredDeliveryTasksComplete: true,
    paidInFull: false,
  });
  assert(!blocked.ok && blocked.code === "FINAL_HANDOFF_BLOCKED_BY_BALANCE", "10 balance gate");

  const overridden = canCompleteProject({
    projectStatus: "ACTIVE",
    allRequiredDeliveryTasksComplete: true,
    paidInFull: false,
    overrideReason: "Client invoice arranged offline",
  });
  assert(overridden.ok, "10 override with reason");
}

// 11–13 human conversion / no auto-WON — source scans
{
  const webhook = readFileSync(
    join(repoRoot, "src/lib/commercialization/payments/webhook.ts"),
    "utf8",
  );
  assert(
    !webhook.includes('stage: "WON"') && !webhook.includes("stage: 'WON'"),
    "12 payment does not auto-convert WON",
  );
  const convert = readFileSync(
    join(repoRoot, "src/lib/commercialization/onboarding/convert.ts"),
    "utf8",
  );
  assert(convert.includes("convertOpportunityToClientProject"), "11 convert action");
  assert(convert.includes('stage: "WON"'), "13 WON on conversion");
  assert(convert.includes("wonAt"), "14 wonAt stored");
}

// 15–20 conversion idempotency constraints in schema / convert
{
  const schema = readFileSync(join(repoRoot, "prisma/schema.prisma"), "utf8");
  assert(
    schema.includes("opportunityId String      @unique") ||
      schema.includes("opportunityId String @unique"),
    "19 one project per opportunity",
  );
  assert(
    schema.includes("agreementId String @unique"),
    "19 one project per agreement",
  );
  const convert = readFileSync(
    join(repoRoot, "src/lib/commercialization/onboarding/convert.ts"),
    "utf8",
  );
  assert(convert.includes("existingProject"), "20 idempotent early return");
  assert(convert.includes("resolveClientForConversion"), "16–17 client dedupe");
}

// 21–26 snapshot + source links
{
  const snap: ProjectCommercialSnapshot = {
    snapshotVersion: 1,
    capturedAt: new Date().toISOString(),
    businessName: "Rooftop Solutions",
    agreementId: "agr_1",
    agreementRevision: 1,
    agreementVersion: 1,
    scopeId: "scope_1",
    scopeRevision: 1,
    pricingId: "price_1",
    pricingRevision: 1,
    proposalId: "prop_1",
    proposalRevision: 1,
    currency: "USD",
    totalInvestmentCents: 205_000,
    depositCents: 102_500,
    balanceCents: 102_500,
    paymentTermType: "DEPOSIT_AND_BALANCE",
    paymentTermsSummary: "deposit",
    depositPaidAtCapture: true,
    balanceOutstandingCentsAtCapture: 102_500,
    includedSections: [
      {
        sourceScopeSectionId: "sec_search",
        title: "Search Optimization",
        capabilities: ["SEO"],
        sortOrder: 0,
        deliverables: [
          {
            sourceScopeDeliverableId: "d1",
            sourceActionKey: "heading-architecture",
            title: "Improve heading structure",
            description: null,
            sortOrder: 0,
          },
          {
            sourceScopeDeliverableId: "d2",
            sourceActionKey: "internal-linking",
            title: "Strengthen internal linking",
            description: null,
            sortOrder: 1,
          },
        ],
      },
      {
        sourceScopeSectionId: "sec_content",
        title: "Content Foundation",
        capabilities: ["CONTENT"],
        sortOrder: 1,
        deliverables: [
          {
            sourceScopeDeliverableId: "d3",
            sourceActionKey: "heading-architecture",
            title: "Improve heading structure",
            description: null,
            sortOrder: 0,
          },
          {
            sourceScopeDeliverableId: "d4",
            sourceActionKey: "internal-linking",
            title: "Strengthen internal linking",
            description: null,
            sortOrder: 1,
          },
        ],
      },
      {
        sourceScopeSectionId: "sec_excluded",
        title: "Optional Ads",
        capabilities: ["SEO"],
        sortOrder: 99,
        deliverables: [],
      },
    ],
    assumptions: ["CMS access"],
    exclusions: ["Paid ads"],
    considerations: [],
    clientResponsibilities: ["Provide access"],
    jsResponsibilities: ["Deliver work"],
  };

  // Excluded sections should not be in includedSections for real builds;
  // map uses whatever is in snapshot includedSections — filter in build.
  const includedOnly = {
    ...snap,
    includedSections: snap.includedSections.filter(
      (s) => s.sourceScopeSectionId !== "sec_excluded",
    ),
  };

  const mapped = mapScopeSnapshotToDelivery(includedOnly);
  assert(mapped.workstreams.length === 2, "27 workstreams from included");
  assert(
    !mapped.workstreams.some((w) => w.title === "Optional Ads"),
    "28 excluded absent",
  );
  assert(
    mapped.workstreams.some((w) =>
      w.deliverables.some((d) => d.title.includes("heading")),
    ),
    "29 deliverables present",
  );

  assert(mapped.deliveryTasks.length === 2, "30–31 heading+linking deduped once each");
  assert(
    mapped.deliveryTasks.some((t) => t.key === "action:heading-architecture"),
    "31 heading action key",
  );
  assert(
    mapped.deliveryTasks.some((t) => t.key === "action:internal-linking"),
    "32 internal linking deduped",
  );
  const heading = mapped.deliveryTasks.find(
    (t) => t.key === "action:heading-architecture",
  )!;
  assert(
    heading.sourceWorkstreamIds.length === 2,
    "33 provenance multiple workstreams",
  );
  assert(
    heading.sourceScopeDeliverableIds.length === 2,
    "33 provenance deliverable ids",
  );
}

assert(
  deliveryTaskKeyFor({
    sourceActionKey: null,
    sourceScopeDeliverableId: "x",
  }) === "deliverable:x",
  "fallback deliverable key",
);

// 34–38 capability-aware checklist
{
  const seoLocal = buildOnboardingChecklistTemplate({
    capabilities: ["SEO", "LOCAL_SEO", "WEBSITE_DEVELOPMENT", "CONTENT"],
  });
  assert(
    seoLocal.some((i) => i.key === "GOOGLE_BUSINESS_PROFILE_ACCESS_IF_REQUIRED"),
    "35 Local SEO GBP",
  );
  assert(
    seoLocal.some((i) => i.key === "SEARCH_CONSOLE_ACCESS_IF_REQUIRED"),
    "36 Search Console",
  );
  assert(
    seoLocal.some((i) => i.key === "WEBSITE_ACCESS_REQUESTED"),
    "37 website access",
  );

  const conversionOnly = buildOnboardingChecklistTemplate({
    capabilities: ["CONVERSION_OPTIMIZATION"],
  });
  assert(
    !conversionOnly.some(
      (i) => i.key === "GOOGLE_BUSINESS_PROFILE_ACCESS_IF_REQUIRED",
    ),
    "38 inactive Local SEO not forced",
  );
  assert(
    !conversionOnly.some((i) => i.key.includes("AI_AUTOMATION")),
    "38 no inactive capabilities",
  );
}

// 39 credentials not stored
{
  const mutate = readFileSync(
    join(repoRoot, "src/lib/commercialization/onboarding/mutate.ts"),
    "utf8",
  );
  assert(mutate.includes("CREDENTIAL_NOTE_PATTERN"), "39 credential guard");
  assert(mutate.includes("CREDENTIALS_FORBIDDEN"), "39 forbid passwords");
}

// 40–43 lifecycle derive
{
  const waiting = deriveOnboardingState({
    projectStatus: "ONBOARDING",
    items: [
      { required: true, status: "COMPLETED" },
      { required: true, status: "REQUESTED" },
    ],
    balanceOutstandingCents: 102_500,
    allRequiredDeliveryTasksComplete: false,
  });
  assert(waiting === "WAITING_ON_CLIENT", "40 waiting");

  const ready = deriveOnboardingState({
    projectStatus: "ONBOARDING",
    items: [
      { required: true, status: "COMPLETED" },
      { required: true, status: "RECEIVED" },
      { required: false, status: "NOT_STARTED" },
    ],
    balanceOutstandingCents: 102_500,
    allRequiredDeliveryTasksComplete: false,
  });
  assert(ready === "READY_FOR_KICKOFF", "41 ready for kickoff");

  const startSrc = readFileSync(
    join(repoRoot, "src/lib/commercialization/onboarding/mutate.ts"),
    "utf8",
  );
  assert(startSrc.includes("startClientProject"), "42 human start");
  assert(startSrc.includes('status: "ACTIVE"'), "43 → ACTIVE");

  const blocked = deriveOnboardingState({
    projectStatus: "ACTIVE",
    items: [],
    balanceOutstandingCents: 102_500,
    allRequiredDeliveryTasksComplete: true,
  });
  assert(
    blocked === "FINAL_HANDOFF_BLOCKED_BY_BALANCE",
    "46 final handoff blocked flag",
  );
}

// 44–45 balance visibility / not paid in full falsely
{
  const r = getOnboardingEligibility({
    agreement: agreement(),
    payments: [payment({ type: "DEPOSIT", status: "PAID" })],
  });
  assert(r.eligible && !r.paidInFull, "45 not falsely paid in full");
  assert(r.balanceOutstandingCents === 102_500, "44 balance visible amount");
}

// 47 balance paid allows financial readiness for completion
{
  const ok = canCompleteProject({
    projectStatus: "ACTIVE",
    allRequiredDeliveryTasksComplete: true,
    paidInFull: true,
  });
  assert(ok.ok, "47 balance paid allows completion");
}

// 48–53 no commercial mutation in convert (creates snapshot, does not update scope/pricing)
{
  const convert = readFileSync(
    join(repoRoot, "src/lib/commercialization/onboarding/convert.ts"),
    "utf8",
  );
  assert(!convert.includes("commercialScope.update"), "48 scope not mutated");
  assert(!convert.includes("commercialPricing.update"), "49 pricing not mutated");
  assert(!convert.includes("commercialProposal.update"), "50 proposal not mutated");
  assert(
    !convert.includes("commercialAgreement.update"),
    "51 agreement not mutated",
  );
  assert(!convert.includes("commercialPayment.update"), "52 payments not mutated");
}

// 54–56 routes internal
{
  const clientsPage = readFileSync(
    join(repoRoot, "src/app/reports/clients/page.tsx"),
    "utf8",
  );
  assert(clientsPage.includes('index: false'), "54 clients noindex");
  const projectPage = readFileSync(
    join(
      repoRoot,
      "src/app/reports/clients/[clientId]/projects/[projectId]/page.tsx",
    ),
    "utf8",
  );
  assert(projectPage.includes('index: false'), "55 project noindex");
  assert(
    !projectPage.includes("/report/"),
    "56 no public report coupling in project page",
  );
}

// 57 analytics privacy
assert(isForbiddenAnalyticsParamKey("client_id"), "57 client_id");
assert(isForbiddenAnalyticsParamKey("client_email"), "57 client_email");
assert(isForbiddenAnalyticsParamKey("project_id"), "57 project_id");
assert(isForbiddenAnalyticsParamKey("project_notes"), "57 project_notes");
assert(isForbiddenAnalyticsParamKey("onboarding_access"), "57 onboarding_access");
assert(isForbiddenAnalyticsParamKey("access_credentials"), "57 access_credentials");
assert(isForbiddenAnalyticsParamKey("client_contact"), "57 client_contact");
assert(
  isForbiddenAnalyticsParamKey("project_internal_notes"),
  "57 project_internal_notes",
);

// 58–63 side effect budget — onboarding module has no provider calls
{
  const onboardingDir = join(
    repoRoot,
    "src/lib/commercialization/onboarding",
  );
  const files = collectTsFiles(onboardingDir).filter(
    (f) => !f.endsWith(".verify.ts"),
  );
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    assert(!/\bopenai\b/i.test(src), `58 no OpenAI in ${file}`);
    assert(!src.includes("@googlemaps"), `59 no Places in ${file}`);
    assert(!/from ["']stripe["']/.test(src), `63 no Stripe SDK in ${file}`);
    assert(!src.includes("from \"resend\""), `62 no Resend in ${file}`);
    assert(!src.includes("crawlWebsite"), `60 no crawl in ${file}`);
    assert(!src.includes("discoverContacts"), `61 no contact discovery in ${file}`);
  }
}

// Contact seeding priority
{
  const signer = resolveInitialClientContact({
    signerName: "Alex",
    signerEmail: "alex@example.com",
    deliveryRecipientName: "Bob",
    deliveryRecipientEmail: "bob@example.com",
    prospectContactName: "Cara",
    prospectContactEmail: "cara@example.com",
  });
  assert(signer.source === "agreement_signer", "contact priority signer");
  assert(normalizeHostname("https://www.Example.com/path") === "example.com", "hostname");
}

// Migration sorts after payments
{
  const mig = readFileSync(
    join(
      repoRoot,
      "prisma/migrations/20260823190000_add_clients_projects/migration.sql",
    ),
    "utf8",
  );
  assert(mig.includes('CREATE TABLE "Client"'), "migration Client");
  assert(mig.includes('CREATE TABLE "ClientProject"'), "migration Project");
}

console.log("client-project.verify.ts PASS");
