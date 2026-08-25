"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";
import { createLeadFromContactAction } from "@/app/reports/growth/follow-up/actions";

type ExistingLead = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string | null;
  status: string;
};

type Props = {
  submissionId: string;
  decisionHint: "CREATE_NEW" | "POSSIBLE_EXISTING" | "ALREADY_LINKED";
  existingLeads: ExistingLead[];
  linkedLeadId?: string | null;
};

export function CreateLeadFromContactForm({
  submissionId,
  decisionHint,
  existingLeads,
  linkedLeadId,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);

  if (decisionHint === "ALREADY_LINKED" && linkedLeadId) {
    return (
      <p className="text-sm text-muted" data-testid="contact-already-linked">
        Already linked to lead.{" "}
        <a className="underline" href={`/reports/leads/${linkedLeadId}`}>
          Open lead
        </a>
      </p>
    );
  }

  function submit(decision: "CREATE_NEW" | "LINK_EXISTING", leadId?: string) {
    if (locked.current || pending) return;
    locked.current = true;
    setError(null);
    const formData = new FormData();
    formData.set("submissionId", submissionId);
    formData.set("decision", decision);
    if (leadId) {
      formData.set("linkExistingLeadId", leadId);
    }
    startTransition(async () => {
      const result = await createLeadFromContactAction(formData);
      locked.current = false;
      if (!result.ok) {
        setError(
          result.error === "possible_existing"
            ? "Matching email exists — link existing instead of creating."
            : result.error,
        );
        return;
      }
      if (result.leadId) {
        router.push(`/reports/leads/${result.leadId}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="space-y-3 rounded-lg border border-border bg-white p-4"
      data-testid="create-lead-from-contact"
    >
      <h3 className="text-sm font-semibold text-brand">Create Lead</h3>
      <p className="text-xs text-muted">
        Explicit operator action. Idempotent — repeat clicks will not duplicate.
      </p>

      {decisionHint === "CREATE_NEW" ? (
        <Button
          type="button"
          disabled={pending}
          onClick={() => submit("CREATE_NEW")}
        >
          {pending ? "Creating…" : "Create new Lead"}
        </Button>
      ) : null}

      {existingLeads.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-brand">Possible existing</p>
          <ul className="space-y-2">
            {existingLeads.map((lead) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  {lead.firstName} {lead.lastName} · {lead.status}
                  {lead.company ? ` · ${lead.company}` : ""}
                </span>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => submit("LINK_EXISTING", lead.id)}
                >
                  Link existing
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
