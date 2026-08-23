/**
 * Growth content ledger create/dedupe verification.
 * Pure helpers run always; DB cases load prisma after dotenv.
 */

import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

// Allow importing server-only content-store from Node verify scripts.
const require = createRequire(import.meta.url);
require.cache[require.resolve("server-only")] = {
  id: require.resolve("server-only"),
  filename: require.resolve("server-only"),
  loaded: true,
  exports: {},
} as NodeModule;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const { GROWTH_BASELINE_V1 } = await import("@/lib/growth/baseline-v1");
  const {
    GROWTH_CONTENT_RAPID_DUPLICATE_WINDOW_MS,
    buildGrowthContentIdentityFingerprint,
    isWithinRapidDuplicateWindow,
    matchesGrowthContentIdentityFingerprint,
  } = await import("@/lib/growth/content-dedupe");
  const {
    createGrowthContentRecord,
    parseOptionalIntField,
    updateGrowthContentManualMetrics,
  } = await import("@/lib/growth/content-store");
  const { prisma } = await import("@/lib/prisma");

  assert(
    GROWTH_CONTENT_RAPID_DUPLICATE_WINDOW_MS === 120_000,
    "rapid duplicate window is 120s",
  );

  const baseFingerprint = buildGrowthContentIdentityFingerprint({
    publisherType: "COMPANY",
    utmContent: "company_seo_mistakes_001",
    publishedAt: new Date("2026-08-23T00:00:00.000Z"),
    title: "SEO Mistakes",
    contentJob: "AUTHORITY",
    contentPillar: "WEBSITE_AUDITS",
    contentFormat: "PHOTO",
    createdByEmail: "ops@js-growth.com",
  });

  const sameFingerprint = buildGrowthContentIdentityFingerprint({
    publisherType: "COMPANY",
    utmContent: "company_seo_mistakes_001",
    publishedAt: new Date("2026-08-23T00:00:00.000Z"),
    title: "  seo mistakes ",
    contentJob: "AUTHORITY",
    contentPillar: "WEBSITE_AUDITS",
    contentFormat: "PHOTO",
    createdByEmail: "OPS@js-growth.com",
  });

  assert(
    matchesGrowthContentIdentityFingerprint(baseFingerprint, sameFingerprint),
    "fingerprint normalizes title/email",
  );

  const differentSlug = buildGrowthContentIdentityFingerprint({
    publisherType: "COMPANY",
    utmContent: "company_seo_mistakes_002",
    publishedAt: new Date("2026-08-23T00:00:00.000Z"),
    title: "SEO Mistakes",
    contentJob: "AUTHORITY",
    contentPillar: "WEBSITE_AUDITS",
    contentFormat: "PHOTO",
    createdByEmail: "ops@js-growth.com",
  });
  assert(
    !matchesGrowthContentIdentityFingerprint(baseFingerprint, differentSlug),
    "different utmContent is distinct",
  );

  const now = new Date("2026-08-23T12:00:00.000Z");
  assert(
    isWithinRapidDuplicateWindow(new Date("2026-08-23T11:59:00.000Z"), now),
    "60s ago is within window",
  );
  assert(
    !isWithinRapidDuplicateWindow(new Date("2026-08-23T11:57:00.000Z"), now),
    "180s ago is outside window",
  );

  assert(parseOptionalIntField("") === null, "blank metric → null NOT_CAPTURED");
  assert(parseOptionalIntField("0") === 0, "observed zero preserved");
  assert(parseOptionalIntField("69") === 69, "positive int parsed");

  assert(GROWTH_BASELINE_V1.facebook.followers === 75, "baseline unchanged");

  const here = dirname(fileURLToPath(import.meta.url));
  const formSource = readFileSync(
    join(here, "../../components/growth/create-content-form.tsx"),
    "utf8",
  );
  assert(formSource.includes("isPending"), "form uses isPending submit lock");
  assert(formSource.includes("Saving..."), "form pending label");
  assert(
    formSource.includes("disabled={isPending}"),
    "submit disabled while pending",
  );
  assert(formSource.includes('role="status"'), "accessible status messaging");
  assert(formSource.includes("aria-busy"), "aria-busy while pending");
  assert(
    !formSource.includes("pointer-events-none"),
    "does not rely on pointer-events alone",
  );

  const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const companySlug = `dedupe_co_${suffix}`;
  const founderSlug = `dedupe_fo_${suffix}`;
  const otherSlug = `dedupe_other_${suffix}`;
  const createdIds: string[] = [];

  try {
    const first = await createGrowthContentRecord({
      publisherType: "COMPANY",
      publishedAt: new Date("2026-08-23T00:00:00.000Z"),
      contentJob: "AUTHORITY",
      contentPillar: "SEO",
      contentFormat: "PHOTO",
      contentSlug: companySlug,
      title: "Dedupe test company",
      fbViews: 69,
      fbEngagements: 1,
      fbComments: 0,
      createdByEmail: "verify@js-growth.com",
    });
    assert(first.ok, "normal create succeeds");
    if (!first.ok) {
      throw new Error("unreachable");
    }
    assert(first.deduplicated === false, "first create not deduplicated");
    createdIds.push(first.id);

    const row = await prisma.growthContentRecord.findUnique({
      where: { id: first.id },
    });
    assert(row?.fbViews === 69, "views stored");
    assert(row?.fbEngagements === 1, "engagements stored");
    assert(row?.fbComments === 0, "observed zero comments preserved");
    assert(row?.fbReach == null, "blank reach stays null NOT_CAPTURED");

    const rapid = await createGrowthContentRecord({
      publisherType: "COMPANY",
      publishedAt: new Date("2026-08-23T00:00:00.000Z"),
      contentJob: "AUTHORITY",
      contentPillar: "SEO",
      contentFormat: "PHOTO",
      contentSlug: companySlug,
      title: "Dedupe test company",
      fbViews: 69,
      fbEngagements: 1,
      fbComments: 0,
      createdByEmail: "verify@js-growth.com",
    });
    assert(rapid.ok, "rapid duplicate returns ok");
    if (!rapid.ok) {
      throw new Error("unreachable");
    }
    assert(rapid.deduplicated === true, "rapid duplicate flagged");
    assert(rapid.id === first.id, "rapid duplicate returns canonical id");

    const countCompany = await prisma.growthContentRecord.count({
      where: { utmContent: first.utmContent },
    });
    assert(countCompany === 1, "exactly one company record after rapid resubmit");

    const different = await createGrowthContentRecord({
      publisherType: "COMPANY",
      publishedAt: new Date("2026-08-23T00:00:00.000Z"),
      contentJob: "REACH",
      contentPillar: "SEO",
      contentFormat: "TEXT",
      contentSlug: otherSlug,
      title: "Different content",
      createdByEmail: "verify@js-growth.com",
    });
    assert(different.ok, "different content allowed");
    if (different.ok) {
      createdIds.push(different.id);
    }

    const founder = await createGrowthContentRecord({
      publisherType: "FOUNDER",
      publishedAt: new Date("2026-08-23T00:00:00.000Z"),
      contentJob: "TRUST",
      contentPillar: "BUILDING_JS_SOLUTIONS",
      contentFormat: "TEXT",
      contentSlug: founderSlug,
      title: "Founder note",
      createdByEmail: "verify@js-growth.com",
    });
    assert(founder.ok, "founder create allowed");
    if (founder.ok) {
      assert(founder.utmContent.startsWith("founder_"), "founder utm prefix");
      createdIds.push(founder.id);
    }

    const lateDuplicate = await createGrowthContentRecord({
      publisherType: "COMPANY",
      publishedAt: new Date("2026-08-24T00:00:00.000Z"),
      contentJob: "AUTHORITY",
      contentPillar: "SEO",
      contentFormat: "PHOTO",
      contentSlug: companySlug,
      title: "Trying to recreate for metric update",
      fbViews: 180,
      fbEngagements: 8,
      createdByEmail: "verify@js-growth.com",
    });
    assert(!lateDuplicate.ok, "late recreate of same utm_content rejected");
    if (!lateDuplicate.ok) {
      assert(
        lateDuplicate.error.includes("already exists"),
        "helpful already-exists error",
      );
    }

    const updated = await updateGrowthContentManualMetrics({
      id: first.id,
      checkpoint: "HOURS_72",
      fbViews: 180,
      fbEngagements: 8,
      fbComments: 0,
      capturedByEmail: "verify@js-growth.com",
    });
    assert(updated.ok, "metric update on canonical record");
    if (!updated.ok) {
      throw new Error("unreachable");
    }
    assert(updated.checkpoint === "HOURS_72", "72h checkpoint recorded");
    const matured = await prisma.growthContentRecord.findUnique({
      where: { id: first.id },
      include: { metricSnapshots: true },
    });
    assert(matured?.fbViews === 180, "72h-style views update");
    assert(matured?.fbEngagements === 8, "72h-style engagements update");
    assert(matured?.fbComments === 0, "zero still observed zero after update");
    assert(
      matured?.metricSnapshots.some((s) => s.checkpoint === "HOURS_72"),
      "HOURS_72 snapshot exists",
    );

    const stillOne = await prisma.growthContentRecord.count({
      where: { utmContent: first.utmContent },
    });
    assert(stillOne === 1, "metric update did not create a second record");

    const { getMeasurementDueStatus } = await import(
      "@/lib/growth/facebook-execution"
    );
    const due = getMeasurementDueStatus({
      publishedAt: new Date("2026-08-20T00:00:00.000Z"),
      hasInitial: true,
      has72h: false,
      has7d: false,
      now: new Date("2026-08-24T00:00:00.000Z"),
    });
    assert(due === "DUE_72H", "due for 72h after 96 hours");
    const complete = getMeasurementDueStatus({
      publishedAt: new Date("2026-08-01T00:00:00.000Z"),
      hasInitial: true,
      has72h: true,
      has7d: true,
      now: new Date("2026-08-24T00:00:00.000Z"),
    });
    assert(complete === "COMPLETE", "complete when 7d captured");
  } finally {
    if (createdIds.length > 0) {
      await prisma.growthContentRecord.deleteMany({
        where: { id: { in: createdIds } },
      });
    }
    await prisma.$disconnect();
  }

  console.log("growth content-store verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
