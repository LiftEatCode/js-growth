"use client";

import { useActionState, useTransition } from "react";

import {
  createGbpPostPlanAction,
  createGbpSupportContentPlanAction,
  type GbpContentPlanFormState,
} from "@/app/reports/growth/local/actions";
import { Button } from "@/components/ui";

const initial: GbpContentPlanFormState = { success: false, message: "" };

export function CreateGbpContentButtons() {
  const [supportState, supportAction] = useActionState(
    createGbpSupportContentPlanAction,
    initial,
  );
  const [postState, postAction] = useActionState(
    createGbpPostPlanAction,
    initial,
  );
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <form
        action={(fd) => {
          startTransition(() => {
            supportAction(fd);
          });
        }}
      >
        <Button type="submit" disabled={pending} data-testid="create-gbp-support-plan">
          Create GBP support content plan
        </Button>
      </form>
      <form
        data-testid="create-gbp-post-plan-form"
        action={(fd) => {
          startTransition(() => {
            postAction(fd);
          });
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          type="hidden"
          name="sourceAssetSlug"
          value="seo"
          data-testid="gbp-post-source-slug"
        />
        <Button type="submit" disabled={pending} data-testid="create-gbp-post-plan">
          Create GBP_POST from /seo
        </Button>
      </form>
      <div className="text-xs text-muted">
        {supportState.message ? (
          <p data-testid="gbp-support-plan-message">{supportState.message}</p>
        ) : null}
        {postState.message ? (
          <p data-testid="gbp-post-plan-message">{postState.message}</p>
        ) : null}
      </div>
    </div>
  );
}
