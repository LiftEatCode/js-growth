"use client";

import { useEffect, useRef } from "react";

import {
  readAcquisitionForForm,
  serializeAcquisitionForForm,
} from "@/lib/growth/acquisition-capture";

/** Hidden field that posts first-party acquisition context with a form. */
export function GrowthAttributionField() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const attribution = readAcquisitionForForm();
    if (inputRef.current) {
      inputRef.current.value = serializeAcquisitionForForm(attribution);
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
