"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const REFRESH_DELAY_MS = 8_000;

export function ReportAiGeneratingRefresh() {
  const router = useRouter();
  const refreshed = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (refreshed.current) {
        return;
      }

      refreshed.current = true;
      router.refresh();
    }, REFRESH_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [router]);

  return null;
}
