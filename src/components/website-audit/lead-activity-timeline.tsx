import {
    CalendarClock,
    Clock3,
    FileText,
    History,
    Mail,
    NotebookPen,
    Phone,
    Target,
    UserRoundPlus,
    Users,
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
  
  function getManualActivityLabel(
    value: string | null,
  ): string {
    if (value === "CALL") {
      return "Call";
    }
  
    if (value === "EMAIL") {
      return "Email";
    }
  
    if (value === "MEETING") {
      return "Meeting";
    }
  
    if (value === "FOLLOW_UP") {
      return "Follow-Up";
    }
  
    return "Note";
  }
  
  function ActivityIcon({
    activity,
  }: {
    activity: LeadActivityItem;
  }) {
    if (
      activity.type ===
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
      activity.type ===
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
      activity.type ===
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
      activity.type ===
      "MANUAL_NOTE"
    ) {
      if (
        activity.fromValue ===
        "CALL"
      ) {
        return (
          <Phone
            aria-hidden="true"
            className="size-4"
          />
        );
      }
  
      if (
        activity.fromValue ===
        "EMAIL"
      ) {
        return (
          <Mail
            aria-hidden="true"
            className="size-4"
          />
        );
      }
  
      if (
        activity.fromValue ===
        "MEETING"
      ) {
        return (
          <Users
            aria-hidden="true"
            className="size-4"
          />
        );
      }
  
      if (
        activity.fromValue ===
        "FOLLOW_UP"
      ) {
        return (
          <CalendarClock
            aria-hidden="true"
            className="size-4"
          />
        );
      }
  
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
    activity: LeadActivityItem,
  ): string {
    if (
      activity.type ===
      "STATUS_CHANGED"
    ) {
      return "Pipeline";
    }
  
    if (
      activity.type ===
      "FOLLOW_UP_CHANGED"
    ) {
      return "Follow-Up";
    }
  
    if (
      activity.type ===
      "NOTES_UPDATED"
    ) {
      return "Notes";
    }
  
    if (
      activity.type ===
      "MANUAL_NOTE"
    ) {
      return getManualActivityLabel(
        activity.fromValue,
      );
    }
  
    return "Lead";
  }
  
  function getPrimaryActivityText(
    activity: LeadActivityItem,
  ): string {
    if (
      activity.type ===
        "MANUAL_NOTE" &&
      activity.toValue
    ) {
      return activity.toValue;
    }
  
    return activity.description;
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
              Calls, emails, meetings, notes, pipeline changes, and follow-ups are recorded chronologically.
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
                    activity={
                      activity
                    }
                  />
                </span>
  
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                      {getActivityLabel(
                        activity,
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
  
                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-brand">
                    {getPrimaryActivityText(
                      activity,
                    )}
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