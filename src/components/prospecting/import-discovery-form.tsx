"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { importDiscoveryCandidates } from "@/app/reports/prospecting/discovery-actions";
import { Button } from "@/components/ui";
import { discoveryCandidateStatusLabel } from "@/lib/prospecting/labels";

export interface DiscoveryCandidateRow {
  id: string;
  businessName: string;
  website: string | null;
  hostname: string | null;
  formattedAddress: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  category: string | null;
  status: Parameters<typeof discoveryCandidateStatusLabel>[0];
  exclusionReason: string | null;
  importedProspectId: string | null;
}

interface ImportDiscoveryFormProps {
  campaignId: string;
  runId: string;
  candidates: DiscoveryCandidateRow[];
}

function locationLabel(candidate: DiscoveryCandidateRow): string {
  if (candidate.city && candidate.state) {
    return `${candidate.city}, ${candidate.state}`;
  }

  return candidate.formattedAddress || "—";
}

export function ImportDiscoveryForm({
  campaignId,
  runId,
  candidates,
}: ImportDiscoveryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const eligible = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          candidate.status === "ELIGIBLE" && !candidate.importedProspectId,
      ),
    [candidates],
  );
  const excluded = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          candidate.status !== "ELIGIBLE" || candidate.importedProspectId,
      ),
    [candidates],
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllEligible() {
    setSelectedIds(new Set(eligible.map((candidate) => candidate.id)));
  }

  function handleSubmit() {
    setError(null);
    setMessage(null);

    const formData = new FormData();
    for (const id of selectedIds) {
      formData.append("candidateId", id);
    }

    startTransition(async () => {
      const result = await importDiscoveryCandidates(
        campaignId,
        runId,
        formData,
      );

      if (!result.success) {
        setError(result.message ?? "The selected businesses could not be imported.");
        return;
      }

      setMessage(result.message ?? "Imported selected prospects.");
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {eligible.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-brand">
                Eligible businesses
              </h2>
              <p className="mt-1 text-sm text-muted">
                Select businesses to import as Prospects. Nothing is imported
                until you confirm.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllEligible}
                disabled={isPending}
              >
                Select all eligible
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={isPending || selectedIds.size === 0}
              >
                {isPending ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : null}
                Import Selected Prospects
              </Button>
            </div>
          </div>

          {error ? (
            <p className="border-b border-border px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="border-b border-border px-4 py-3 text-sm text-brand">
              {message}
            </p>
          ) : null}

          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Import</th>
                <th className="px-4 py-3 font-semibold">Business</th>
                <th className="px-4 py-3 font-semibold">Website</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Eligibility</th>
              </tr>
            </thead>
            <tbody>
              {eligible.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(candidate.id)}
                      disabled={isPending}
                      onChange={() => toggle(candidate.id)}
                      aria-label={`Import ${candidate.businessName}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand">
                    {candidate.businessName}
                  </td>
                  <td className="px-4 py-3">
                    {candidate.website ? (
                      <a
                        href={candidate.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-blue hover:underline"
                      >
                        {candidate.hostname ?? candidate.website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{locationLabel(candidate)}</td>
                  <td className="px-4 py-3">{candidate.category || "—"}</td>
                  <td className="px-4 py-3">{candidate.phone || "—"}</td>
                  <td className="px-4 py-3">
                    {discoveryCandidateStatusLabel(candidate.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <p className="text-sm leading-6 text-muted">
          No eligible businesses in this run. Existing prospects, leads,
          suppressed hostnames, and businesses without websites are listed
          below and cannot be imported.
        </p>
      )}

      {excluded.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border px-4 py-4">
            <h2 className="font-heading text-lg font-semibold text-brand">
              Excluded from import
            </h2>
            <p className="mt-1 text-sm text-muted">
              Counted in run statistics, but not shown as importable by
              default.
            </p>
          </div>
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Business</th>
                <th className="px-4 py-3 font-semibold">Website</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody>
              {excluded.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-3 font-semibold text-brand">
                    {candidate.businessName}
                  </td>
                  <td className="px-4 py-3">
                    {candidate.hostname ?? candidate.website ?? "—"}
                  </td>
                  <td className="px-4 py-3">{locationLabel(candidate)}</td>
                  <td className="px-4 py-3">{candidate.category || "—"}</td>
                  <td className="px-4 py-3">
                    {candidate.importedProspectId
                      ? "Imported"
                      : discoveryCandidateStatusLabel(candidate.status)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {candidate.importedProspectId
                      ? "Already imported from this run."
                      : candidate.exclusionReason || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
