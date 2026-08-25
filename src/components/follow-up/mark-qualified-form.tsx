"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";
import { markLeadQualifiedAction } from "@/app/reports/growth/follow-up/actions";

export function MarkLeadQualifiedForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      data-testid="mark-qualified"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.set("leadId", leadId);
        startTransition(async () => {
          await markLeadQualifiedAction(formData);
          router.refresh();
        });
      }}
    >
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Mark QUALIFIED"}
      </Button>
      <p className="mt-1 text-xs text-muted">
        Does not auto-create an Opportunity. Use commercial workflow when ready.
      </p>
    </form>
  );
}
