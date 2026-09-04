"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export function MicrosoftClarity() {
  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();

    if (!projectId) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Microsoft Clarity project ID is missing.");
      }
      return;
    }

    Clarity.init(projectId);
  }, []);

  return null;
}
