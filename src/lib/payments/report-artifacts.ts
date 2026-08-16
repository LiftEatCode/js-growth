import { getInternalSession } from "@/lib/internal-auth";
import { reportHasProfessionalEntitlement } from "@/lib/payments/professional-audit";
import { resolveReportTier } from "@/lib/website-audit/report-access";
import type { ReportMode } from "@/lib/website-audit/types";

export async function canServeProfessionalReportArtifact(options: {
  reportId: string;
  reportMode: ReportMode;
}): Promise<boolean> {
  const [professionallyUnlocked, internalSession] = await Promise.all([
    reportHasProfessionalEntitlement(options.reportId),
    getInternalSession(),
  ]);

  if (internalSession) {
    return true;
  }

  return (
    resolveReportTier({
      mode: options.reportMode,
      professionallyUnlocked,
    }) === "professional"
  );
}
