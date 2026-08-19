import type { RankableProspect } from "./types";

export function rankCampaignProspects(
  rows: RankableProspect[],
  desiredCount: number,
): Array<{
  prospectId: string;
  qualificationRank: number | null;
  isSelectedTopN: boolean;
}> {
  const desired = Math.max(1, Math.min(50, Math.floor(desiredCount) || 5));

  const qualified = rows
    .filter(
      (row) =>
        row.qualificationStatus === "QUALIFIED" &&
        typeof row.score === "number",
    )
    .slice()
    .sort((left, right) => {
      const scoreDelta = (right.score ?? 0) - (left.score ?? 0);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      const name = left.businessName.localeCompare(right.businessName);
      if (name !== 0) {
        return name;
      }

      return left.prospectId.localeCompare(right.prospectId);
    });

  const selected = new Set(
    qualified.slice(0, desired).map((row) => row.prospectId),
  );

  return rows.map((row) => {
    const index = qualified.findIndex((item) => item.prospectId === row.prospectId);

    return {
      prospectId: row.prospectId,
      qualificationRank: index >= 0 ? index + 1 : null,
      isSelectedTopN: selected.has(row.prospectId),
    };
  });
}
