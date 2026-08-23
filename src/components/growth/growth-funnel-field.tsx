"use client";

import { useEffect, useRef } from "react";

import { serializeAuditFunnelContextForForm } from "@/lib/growth/audit-funnel";

/** Hidden field that posts first-party funnel milestones captured in this tab. */
export function GrowthFunnelField() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = serializeAuditFunnelContextForForm();
    }
  }, []);

  return (
    <input
      ref={inputRef}
      type="hidden"
      name="growth_funnel"
      value=""
      readOnly
    />
  );
}
