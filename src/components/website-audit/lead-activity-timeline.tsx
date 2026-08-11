import {
    CalendarClock,
    Clock3,
    FileText,
    History,
    NotebookPen,
    Target,
    UserRoundPlus,
  } from "lucide-react";
  
  import {
    Card,
  } from "@/components/ui";
  
  export interface LeadActivityItem {
    id: string;
  
    createdAt: string;
  
    type:
      | "CREATED"
      | "STATUS_CHANGED"
      | "FOLLOW_UP_CHANGED"
      | "NOTES_UPDATED"
      | "MANUAL_NOTE";
  
    description: string;
  
    fromValue:
      | string
      | null;
  
    toValue:
      | string
      | null;
  }
  
  interface LeadActivityTimelineProps {
    leadCreatedAt: string;
  
    activities:
      LeadActivityItem[];
  }
  
  function formatDate(
    value: string,
  ): string {
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "Unknown date";
    }
  
    return new Intl.DateTimeFormat(
      "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    ).format(date);
  }
  
  function ActivityIcon({
    type,
  }: {
    type:
      LeadActivityItem["type"];
  }) {
    if (
      type ===
      "STATUS_CHANGED"
    ) {
      return (
        <Target
          aria-hidden="true"
          className="size-4"
        />
      );
    }
  
    if (
      type ===
      "FOLLOW_UP_CHANGED"
    ) {
      return (
        <CalendarClock
          aria-hidden="true"
          className="size-4"
        />
      );
    }
  
    if (
      type ===
      "NOTES_UPDATED"
    ) {
      return (
        <NotebookPen
          aria-hidden="true"
          className="size-4"
        />
      );
    }

    if (
      type ===
      "MANUAL_NOTE"
    ) {
      return (
        <FileText
          aria-hidden="true"
          className="size-4"
        />
      );
    }
  
    return (
      <UserRoundPlus
        aria-hidden="true"
        className="size-4"
      />
    );
  }
  
  function getActivityLabel(
    type:
      LeadActivityItem["type"],
  ): string {
    if (
      type ===
      "STATUS_CHANGED"
    ) {
      return "Pipeline";
    }
  
    if (
      type ===
      "FOLLOW_UP_CHANGED"
    ) {
      return "Follow-Up";
    }
  
    if (
      type ===
      "NOTES_UPDATED"
    ) {
      return "Notes";
    }

    if (
      type ===
      "MANUAL_NOTE"
    ) {
      return "Note";
    }
  
    return "Lead";
  }
  
  export function LeadActivityTimeline({
    leadCreatedAt,
    activities,
  }: LeadActivityTimelineProps) {
    const hasCreatedActivity =
      activities.some(
        (activity) =>
          activity.type ===
          "CREATED",
      );
  
    const timeline =
      hasCreatedActivity
        ? activities
        : [
            ...activities,
            {
              id:
                "lead-created",
              createdAt:
                leadCreatedAt,
              type:
                "CREATED" as const,
              description:
                "Lead captured from the website audit report.",
              fromValue:
                null,
              toValue:
                null,
            },
          ].sort(
            (a, b) =>
              new Date(
                b.createdAt,
              ).getTime() -
              new Date(
                a.createdAt,
              ).getTime(),
          );
  
    return (
      <Card
        variant="elevated"
        padding="lg"
      >
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
            <History
              aria-hidden="true"
              className="size-5"
            />
          </span>
  
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              Activity History
            </p>
  
            <h2 className="mt-2 font-heading text-xl font-semibold text-brand">
              Opportunity timeline.
            </h2>
  
            <p className="mt-2 text-sm leading-6 text-muted">
              Pipeline changes, follow-ups, and note updates are recorded here automatically.
            </p>
          </div>
        </div>
  
        <div className="mt-7">
          {timeline.map(
            (
              activity,
              index,
            ) => (
              <div
                key={
                  activity.id
                }
                className="relative flex gap-4 pb-7 last:pb-0"
              >
                {index <
                timeline.length -
                  1 ? (
                  <div
                    aria-hidden="true"
                    className="absolute left-[19px] top-10 h-[calc(100%-1rem)] w-px bg-border"
                  />
                ) : null}
  
                <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-brand-blue shadow-sm">
                  <ActivityIcon
                    type={
                      activity.type
                    }
                  />
                </span>
  
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                      {getActivityLabel(
                        activity.type,
                      )}
                    </span>
  
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <Clock3
                        aria-hidden="true"
                        className="size-3.5"
                      />
  
                      {formatDate(
                        activity.createdAt,
                      )}
                    </span>
                  </div>
  
                  <p className="mt-2 text-sm font-medium leading-6 text-brand">
                    {
                      activity.description
                    }
                  </p>
  
                  {activity.type ===
                    "NOTES_UPDATED" &&
                  activity.toValue ? (
                    <div className="mt-3 rounded-xl border border-border bg-slate-50/70 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                        <FileText
                          aria-hidden="true"
                          className="size-3.5"
                        />
  
                        Saved Notes
                      </div>
  
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                        {
                          activity.toValue
                        }
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ),
          )}
        </div>
      </Card>
    );
  }