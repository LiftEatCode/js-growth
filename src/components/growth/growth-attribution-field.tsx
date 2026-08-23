"use client";

import { useEffect, useRef } from "react";

import {
  readCampaignAttributionFromBrowser,
  serializeCampaignAttributionForForm,
} from "@/lib/growth";

/** Hidden field that posts first-party campaign context with a form. */
export function GrowthAttributionField() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const attribution = readCampaignAttributionFromBrowser();
    if (inputRef.current) {
      inputRef.current.value =
        serializeCampaignAttributionForForm(attribution);
    }
  }, []);

  return (
    <input
      ref={inputRef}
      type="hidden"
      name="growth_attribution"
      value=""
      readOnly
    />
  );
}
