"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import {
  submitContactForm,
  type ContactFormState,
} from "@/app/contact/actions";
import { budgetOptions, serviceOptions } from "@/content/contact";

const initialState: ContactFormState = {
  success: false,
  message: "",
};

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState(
    submitContactForm,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6"
    >
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="companyWebsite">
          Leave this field empty
        </label>

        <input
          id="companyWebsite"
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          id="name"
          label="Your name"
          required
          error={state.errors?.name?.[0]}
        >
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="John Smith"
            required
            className={inputClassName}
          />
        </FormField>

        <FormField
          id="businessName"
          label="Business name"
          error={state.errors?.businessName?.[0]}
        >
          <input
            id="businessName"
            name="businessName"
            type="text"
            autoComplete="organization"
            placeholder="Your business"
            className={inputClassName}
          />
        </FormField>

        <FormField
          id="email"
          label="Email address"
          required
          error={state.errors?.email?.[0]}
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className={inputClassName}
          />
        </FormField>

        <FormField
          id="phone"
          label="Phone number"
          error={state.errors?.phone?.[0]}
        >
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(936) 555-1234"
            className={inputClassName}
          />
        </FormField>

        <FormField
          id="website"
          label="Current website"
          error={state.errors?.website?.[0]}
        >
          <input
            id="website"
            name="website"
            type="url"
            inputMode="url"
            placeholder="https://yourbusiness.com"
            className={inputClassName}
          />
        </FormField>

        <FormField
          id="service"
          label="What do you need help with?"
          required
          error={state.errors?.service?.[0]}
        >
          <select
            id="service"
            name="service"
            defaultValue=""
            required
            className={inputClassName}
          >
            <option value="" disabled>
              Select a service
            </option>

            {serviceOptions.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="budget"
          label="Estimated budget"
          error={state.errors?.budget?.[0]}
        >
          <select
            id="budget"
            name="budget"
            defaultValue=""
            className={inputClassName}
          >
            <option value="">
              Select a budget range
            </option>

            {budgetOptions.map((budget) => (
              <option key={budget} value={budget}>
                {budget}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField
        id="message"
        label="Tell us about your project"
        required
        error={state.errors?.message?.[0]}
      >
        <textarea
          id="message"
          name="message"
          rows={7}
          required
          placeholder="Tell us about your business, what you need help with, and what you want to accomplish."
          className={`${inputClassName} resize-y`}
        />
      </FormField>

      {state.message ? (
        <div
          role={state.success ? "status" : "alert"}
          className={
            state.success
              ? "flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              : "rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          }
        >
          {state.success ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          ) : null}

          <p>{state.message}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SubmitButton />

        <p className="text-sm text-muted-foreground">
          We typically respond within one business day.
        </p>
      </div>
    </form>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

function FormField({
  id,
  label,
  required = false,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
        {label}

        {required ? (
          <span className="ml-1 text-red-500">*</span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          Send My Request
          <Send className="size-4" />
        </>
      )}
    </button>
  );
}

const inputClassName =
  "min-h-12 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-foreground/10";