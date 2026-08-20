"use client";

import type { OutreachDeliveryTimelineStep } from "@/lib/prospecting/outreach/delivery/state";

interface EmailDeliveryTimelineProps {
  steps: OutreachDeliveryTimelineStep[];
  providerDeliveryStatus: string | null;
}

function formatTimestamp(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function EmailDeliveryTimeline({
  steps,
  providerDeliveryStatus,
}: EmailDeliveryTimelineProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-brand">Email delivery</h3>
        {providerDeliveryStatus ? (
          <p className="mt-1 text-xs text-muted">
            Current state: {providerDeliveryStatus.toLowerCase().replaceAll("_", " ")}
          </p>
        ) : null}
      </div>

      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={`${step.label}-${step.at?.toISOString() ?? "none"}`}>
            <p className="text-sm font-semibold text-brand">{step.label}</p>
            <p className="text-xs text-muted">
              {step.at ? formatTimestamp(step.at) : "—"}
            </p>
          </li>
        ))}
      </ol>

      <p className="text-xs leading-5 text-muted">
        Delivered means the recipient&apos;s mail server accepted the message.
        It does not guarantee inbox placement or that the email was read.
      </p>
    </div>
  );
}
