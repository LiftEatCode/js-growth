"use client";

import {
  useState,
} from "react";
import {
  Columns3,
  List,
} from "lucide-react";

import { PipelineBoard } from "./pipeline-board";
import { ReportsDashboardClient } from "./reports-dashboard-client";
import {
  Button,
} from "@/components/ui";
import type { AuditReportSummary } from "@/lib/website-audit/storage";

interface ReportsViewSwitcherProps {
  reports: AuditReportSummary[];
}

type ReportsView =
  | "board"
  | "list";

export function ReportsViewSwitcher({
  reports,
}: ReportsViewSwitcherProps) {
  const [
    view,
    setView,
  ] =
    useState<ReportsView>(
      "board",
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            Pipeline & Audit Library
          </p>

          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand">
            Opportunities
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-muted">
            Switch between the sales pipeline board and the detailed searchable audit library.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-border bg-white p-1 shadow-sm">
          <Button
            type="button"
            size="sm"
            variant={
              view === "board"
                ? "default"
                : "ghost"
            }
            onClick={() =>
              setView(
                "board",
              )
            }
          >
            <Columns3
              aria-hidden="true"
              className="size-4"
            />

            Board
          </Button>

          <Button
            type="button"
            size="sm"
            variant={
              view === "list"
                ? "default"
                : "ghost"
            }
            onClick={() =>
              setView(
                "list",
              )
            }
          >
            <List
              aria-hidden="true"
              className="size-4"
            />

            List
          </Button>
        </div>
      </div>

      {view === "board" ? (
        <PipelineBoard
          reports={
            reports
          }
        />
      ) : (
        <ReportsDashboardClient
          reports={
            reports
          }
        />
      )}
    </div>
  );
}