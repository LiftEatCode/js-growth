"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  recheckProspectContacts,
  rejectProspectContact,
  rejectProspectContactForm,
  setPrimaryProspectContact,
  setPrimaryProspectContactForm,
  suppressProspectContact,
} from "@/app/reports/prospecting/contact-actions";
import { Button } from "@/components/ui";
import {
  contactConfidenceLabel,
  contactSourceLabel,
  type ContactSourceTypeValue,
} from "@/lib/prospecting/labels";
import type { DetectedContactFormFields } from "@/lib/prospecting/contacts/form-types";

interface ProspectContactRow {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  sourceType: ContactSourceTypeValue;
  sourceUrl: string | null;
  status: string;
  isPrimary: boolean;
  discoveredAt: string;
}

interface ProspectContactFormRow {
  id: string;
  url: string;
  sourcePageUrl: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  detectedFields: DetectedContactFormFields;
  status: string;
  isPrimary: boolean;
  discoveredAt: string;
}

interface ProspectContactsPanelProps {
  campaignId: string;
  prospectId: string;
  contacts: ProspectContactRow[];
  contactForms: ProspectContactFormRow[];
}

function formatDetectedFields(fields: DetectedContactFormFields): string {
  const labels: string[] = [];

  if (fields.hasName) labels.push("Name");
  if (fields.hasEmail) labels.push("Email");
  if (fields.hasPhone) labels.push("Phone");
  if (fields.hasSubject) labels.push("Subject");
  if (fields.hasMessage) labels.push("Message");

  return labels.length > 0 ? labels.join(", ") : "—";
}

export function ProspectContactsPanel({
  campaignId,
  prospectId,
  contacts,
  contactForms,
}: ProspectContactsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const usableEmails = contacts.filter(
    (contact) =>
      contact.status === "DISCOVERED" || contact.status === "SELECTED",
  );
  const usableForms = contactForms.filter(
    (form) => form.status === "DISCOVERED" || form.status === "SELECTED",
  );

  function run(
    action: () => Promise<{ success: boolean; message?: string }>,
  ) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        setError(result.message ?? "The contact could not be updated.");
        return;
      }

      setMessage(result.message ?? "Updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          Public contact channels
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            run(() => recheckProspectContacts(campaignId, prospectId))
          }
        >
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Recheck Contacts
        </Button>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-brand">Email</h3>
        {usableEmails.length === 0 ? (
          <p className="text-sm leading-6 text-muted">
            No public email found.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {contacts.map((contact) => (
              <li key={contact.id} className="space-y-3 px-4 py-4">
                <p className="text-sm font-semibold text-brand">
                  {contact.email}
                  {contact.isPrimary ? " · Primary" : ""}
                </p>
                <dl className="grid gap-2 text-xs text-muted sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      Name
                    </dt>
                    <dd className="mt-1">{contact.name || "Not published"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      Role
                    </dt>
                    <dd className="mt-1">{contact.role || "Not published"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      Confidence
                    </dt>
                    <dd className="mt-1">
                      {contactConfidenceLabel(contact.confidence)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      Source
                    </dt>
                    <dd className="mt-1">
                      {contactSourceLabel(contact.sourceType)}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      Source URL
                    </dt>
                    <dd className="mt-1 break-all">
                      {contact.sourceUrl || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      Discovered
                    </dt>
                    <dd className="mt-1">{contact.discoveredAt}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      Status
                    </dt>
                    <dd className="mt-1">{contact.status.toLowerCase()}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      isPending ||
                      contact.isPrimary ||
                      contact.status === "REJECTED" ||
                      contact.status === "SUPPRESSED"
                    }
                    onClick={() =>
                      run(() =>
                        setPrimaryProspectContact(
                          campaignId,
                          prospectId,
                          contact.id,
                        ),
                      )
                    }
                  >
                    Set Primary
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending || contact.status === "REJECTED"}
                    onClick={() =>
                      run(() =>
                        rejectProspectContact(
                          campaignId,
                          prospectId,
                          contact.id,
                        ),
                      )
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending || contact.status === "SUPPRESSED"}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Suppress ${contact.email}? This blocks future outreach.`,
                        )
                      ) {
                        return;
                      }

                      run(() =>
                        suppressProspectContact(
                          campaignId,
                          prospectId,
                          contact.id,
                        ),
                      );
                    }}
                  >
                    Suppress
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-brand">Contact form</h3>
        {usableForms.length === 0 ? (
          <p className="text-sm leading-6 text-muted">
            {contactForms.length === 0
              ? "No public contact form found."
              : "No usable contact form remains after rejection or suppression."}
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {contactForms.map((form) => (
              <li key={form.id} className="space-y-3 px-4 py-4">
                <p className="text-sm font-semibold text-brand">
                  Found
                  {form.isPrimary ? " · Primary" : ""}
                </p>
                <dl className="grid gap-2 text-xs text-muted sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      URL
                    </dt>
                    <dd className="mt-1 break-all">
                      <a
                        href={form.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue hover:underline"
                      >
                        {form.url}
                      </a>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      Detected
                    </dt>
                    <dd className="mt-1">
                      {formatDetectedFields(form.detectedFields)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      Confidence
                    </dt>
                    <dd className="mt-1">
                      {contactConfidenceLabel(form.confidence)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      Status
                    </dt>
                    <dd className="mt-1">{form.status.toLowerCase()}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-semibold uppercase tracking-[0.08em]">
                      Source page
                    </dt>
                    <dd className="mt-1 break-all">
                      {form.sourcePageUrl || "—"}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={
                      <a
                        href={form.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    Open Contact Form
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      isPending ||
                      form.isPrimary ||
                      form.status === "REJECTED" ||
                      form.status === "SUPPRESSED"
                    }
                    onClick={() =>
                      run(() =>
                        setPrimaryProspectContactForm(
                          campaignId,
                          prospectId,
                          form.id,
                        ),
                      )
                    }
                  >
                    Set Primary
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending || form.status === "REJECTED"}
                    onClick={() =>
                      run(() =>
                        rejectProspectContactForm(
                          campaignId,
                          prospectId,
                          form.id,
                        ),
                      )
                    }
                  >
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}
    </div>
  );
}
