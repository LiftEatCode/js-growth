"use client";

import { Fragment, useState } from "react";

import { EditGrowthContentMetricsForm } from "@/components/growth/edit-content-metrics-form";
import { Button } from "@/components/ui";

type Row = {
  id: string;
  title: string;
  utmContent: string;
  publisherType: string;
  publishedAt: string;
  contentJob: string;
  contentPillar: string;
  contentFormat: string;
  fbViews: number | null;
  fbReach: number | null;
  fbEngagements: number | null;
  fbReactions: number | null;
  fbComments: number | null;
  fbShares: number | null;
  fbPageVisits: number | null;
  fbFollowersGained: number | null;
  fbLinkClicks: number | null;
  notes: string | null;
  measurementStatus: string;
  has72h: boolean;
  has7d: boolean;
};

export function GrowthContentRecordsTable({ rows }: { rows: Row[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-muted">
        No content records yet. Record company and founder posts above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
          <tr>
            <th className="px-4 py-3">Published</th>
            <th className="px-4 py-3">Publisher</th>
            <th className="px-4 py-3">Job / format</th>
            <th className="px-4 py-3">utm_content</th>
            <th className="px-4 py-3">Latest</th>
            <th className="px-4 py-3">Checkpoints</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((row) => (
            <Fragment key={row.id}>
              <tr className="border-b border-border/70">
                <td className="px-4 py-3">{row.publishedAt}</td>
                <td className="px-4 py-3">{row.publisherType}</td>
                <td className="px-4 py-3">
                  {row.contentJob} / {row.contentFormat}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{row.utmContent}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  views={row.fbViews ?? "NOT_CAPTURED"} · eng=
                  {row.fbEngagements ?? "NOT_CAPTURED"}
                </td>
                <td className="px-4 py-3 text-xs">
                  {row.measurementStatus.replaceAll("_", " ")}
                  <br />
                  72h={row.has72h ? "YES" : "NO"} · 7d=
                  {row.has7d ? "YES" : "NO"}
                </td>
                <td className="px-4 py-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditingId((current) =>
                        current === row.id ? null : row.id,
                      )
                    }
                  >
                    {editingId === row.id ? "Close" : "Edit / Record Metrics"}
                  </Button>
                </td>
              </tr>
              {editingId === row.id ? (
                <tr className="border-b border-border/70">
                  <td className="px-4 py-4" colSpan={7}>
                    <EditGrowthContentMetricsForm
                      contentRecordId={row.id}
                      title={row.title}
                      utmContent={row.utmContent}
                      defaultCheckpoint={row.has72h ? "DAYS_7" : "HOURS_72"}
                      defaults={{
                        fbViews: row.fbViews,
                        fbReach: row.fbReach,
                        fbEngagements: row.fbEngagements,
                        fbReactions: row.fbReactions,
                        fbComments: row.fbComments,
                        fbShares: row.fbShares,
                        fbPageVisits: row.fbPageVisits,
                        fbFollowersGained: row.fbFollowersGained,
                        fbLinkClicks: row.fbLinkClicks,
                        notes: row.notes,
                      }}
                    />
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
