/**
 * One-shot operator script: inspect + remove accidental duplicate
 * GrowthContentRecord rows for company_seo_mistakes_001.
 * Keeps the earliest createdAt row as canonical.
 *
 * Usage:
 *   npx tsx scripts/cleanup-duplicate-growth-content.ts inspect
 *   npx tsx scripts/cleanup-duplicate-growth-content.ts delete
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const UTM = "company_seo_mistakes_001";

async function main() {
  const { prisma } = await import("@/lib/prisma");
  const mode = process.argv[2] ?? "inspect";

  const rows = await prisma.growthContentRecord.findMany({
    where: { utmContent: UTM },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${rows.length} row(s) for ${UTM}`);
  for (const r of rows) {
    console.log(
      JSON.stringify({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        publishedAt: r.publishedAt.toISOString(),
        publisherType: r.publisherType,
        contentJob: r.contentJob,
        contentFormat: r.contentFormat,
        title: r.title,
        fbViews: r.fbViews,
        fbEngagements: r.fbEngagements,
        createdByEmail: r.createdByEmail,
      }),
    );
  }

  if (mode !== "delete") {
    console.log('Re-run with "delete" to keep oldest and remove extras.');
    await prisma.$disconnect();
    return;
  }

  if (rows.length < 2) {
    console.log("Nothing to delete.");
    await prisma.$disconnect();
    return;
  }

  const [canonical, ...dupes] = rows;
  if (!canonical) {
    await prisma.$disconnect();
    return;
  }

  const safeDupes = dupes.filter(
    (d) =>
      d.publisherType === canonical.publisherType &&
      d.utmContent === canonical.utmContent &&
      d.contentJob === canonical.contentJob &&
      d.contentFormat === canonical.contentFormat &&
      d.title === canonical.title &&
      d.fbViews === canonical.fbViews &&
      d.fbEngagements === canonical.fbEngagements &&
      d.publishedAt.getTime() === canonical.publishedAt.getTime() &&
      d.createdByEmail === canonical.createdByEmail,
  );

  if (safeDupes.length !== dupes.length) {
    console.error(
      "Abort: not all extras match canonical fingerprint. Inspect manually.",
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  const ids = safeDupes.map((d) => d.id);
  const result = await prisma.growthContentRecord.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`Kept canonical ${canonical.id}`);
  console.log(`Deleted ${result.count}: ${ids.join(", ")}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
