"use client";

import { useActionState, useState } from "react";

import { GrowthAttributionField } from "@/components/growth/growth-attribution-field";
import { AcquisitionCaptureBeacon } from "@/components/growth/growth-page-beacon";
import { Button } from "@/components/ui";
import { requestFreeCheck } from "./actions";

const fields = [
  { name: "businessName", label: "Business name", max: 100, autoComplete: "organization" },
  { name: "city", label: "City", max: 100, autoComplete: "address-level2" },
  { name: "email", label: "Email", max: 254, autoComplete: "email" },
  { name: "website", label: "Website (optional)", max: 200, autoComplete: "url" },
] as const;

export function FreeCheckForm() {
  const [state, action, pending] = useActionState(requestFreeCheck, {
    success: false,
    message: "",
  });
  const [values, setValues] = useState({ businessName: "", city: "", email: "", website: "" });

  return (
    <>
      <AcquisitionCaptureBeacon />
      {state.success ? (
        <p role="status" className="font-semibold text-brand">
          We received your request. Look for a follow-up by email.
        </p>
      ) : (
        <form action={action} className="space-y-4">
          <GrowthAttributionField />
          <div className="hidden" aria-hidden="true">
            <label htmlFor="free-check-company-website">Leave this field empty</label>
            <input id="free-check-company-website" name="companyWebsite" tabIndex={-1} autoComplete="off" />
          </div>
          {state.message && <p role="alert" className="text-red-700">{state.message}</p>}
          {fields.map(({ name, label, max, autoComplete }) => {
            const error = state.errors?.[name]?.[0];
            return (
              <div key={name} className="space-y-1">
                <label htmlFor={name} className="block text-sm font-semibold text-brand">{label}</label>
                <input
                  id={name}
                  name={name}
                  type={name === "email" ? "email" : "text"}
                  autoComplete={autoComplete}
                  inputMode={name === "website" ? "url" : undefined}
                  maxLength={max}
                  required={name !== "website"}
                  value={values[name]}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setValues((previous) => ({ ...previous, [name]: value }));
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${name}-error` : undefined}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-blue"
                />
                {error && <p id={`${name}-error`} className="text-sm text-red-700">{error}</p>}
              </div>
            );
          })}
          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {pending ? "Sending request…" : "Request My Free Check"}
          </Button>
        </form>
      )}
    </>
  );
}
