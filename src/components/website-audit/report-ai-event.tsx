"use client";

import { useEffect } from "react";

import {
  COMMERCIAL_EVENTS,
  trackCommercialEvent,
} from "@/lib/analytics/commercial-events";

interface ReportAiEventProps {
  reportId: string;
  status: "completed" | "unavailable";
  model?: string | null;
}

export function ReportAiEvent({
  reportId,
  status,
  model,
}: ReportAiEventProps) {
  useEffect(() => {
    const key = `jsg-ai-evt-${reportId}-${status}`;

    try {
      if (window.sessionStorage.getItem(key)) {
        return;
      }

      window.sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage may be unavailable; still fire once per mount.
    }

    trackCommercialEvent(
      status === "completed"
        ? COMMERCIAL_EVENTS.aiInterpretationCompleted
        : COMMERCIAL_EVENTS.aiInterpretationFailed,
      {
        status,
        ...(model ? { model } : {}),
      },
    );
  }, [model, reportId, status]);

  return null;
}
