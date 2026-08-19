"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  approveOutreachDraft,
  generateProspectDraft,
  markContactFormSubmitted,
  rejectOutreachDraft,
  saveOutreachDraft,
  sendOutreachMessage,
} from "@/app/reports/prospecting/outreach-actions";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { draftStatusLabel } from "@/lib/prospecting/labels";
import type { OutreachChannelValue } from "@/lib/prospecting/outreach/types";

interface OutreachDraftEditorProps {
  campaignId: string;
  prospectId: string;
  businessName: string;
  canGenerate: boolean;
  draft: {
    id: string;
    channel: OutreachChannelValue;
    toEmail: string | null;
    contactFormUrl: string | null;
    subject: string;
    bodyText: string;
    status: string;
    model: string | null;
    approvedAt: Date | null;
    approvedByEmail: string | null;
    sentAt: Date | null;
    submittedAt: Date | null;
    submittedByEmail: string | null;
    providerMessageId: string | null;
    error: string | null;
  } | null;
}

export function OutreachDraftEditor({
  campaignId,
  prospectId,
  businessName,
  canGenerate,
  draft,
}: OutreachDraftEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [body, setBody] = useState(draft?.bodyText ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<{ success: boolean; message?: string }>) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        setError(result.message ?? "The draft could not be updated.");
        router.refresh();
        return;
      }

      setMessage(result.message ?? "Updated.");
      router.refresh();
    });
  }

  function copyMessage() {
    void navigator.clipboard.writeText(body).then(() => {
      setMessage("Message copied to clipboard.");
    });
  }

  const isContactForm = draft?.channel === "CONTACT_FORM";

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-brand">
        {isContactForm ? "Contact form outreach" : "Outreach draft"}
      </h2>
      <p className="text-sm leading-6 text-muted">
        {isContactForm
          ? "No form is submitted automatically. After approval, copy the message, open the prospect's contact form in a new tab, submit it manually, then mark as submitted."
          : "No email is sent automatically. Send is available only after a draft is explicitly approved."}
      </p>
      {draft ? (
        (() => {
          const terminal =
            draft.status === "SENT" ||
            draft.status === "SENDING" ||
            draft.status === "SUBMITTED" ||
            draft.status === "SUPPRESSED";
          const editable = !terminal;
          const canSendEmail =
            draft.channel === "EMAIL" && draft.status === "APPROVED";
          const canMarkSubmitted =
            draft.channel === "CONTACT_FORM" && draft.status === "APPROVED";
          const canMarkApproved = !terminal;

          return (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!editable) return;
                run(() =>
                  saveOutreachDraft({
                    campaignId,
                    prospectId,
                    messageId: draft.id,
                    subject,
                    body,
                  }),
                );
              }}
            >
              {isContactForm ? (
                <>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      Business
                    </label>
                    <p className="mt-1 text-sm text-brand">{businessName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      Contact form
                    </label>
                    {draft.contactFormUrl ? (
                      <p className="mt-1 break-all text-sm text-brand">
                        <a
                          href={draft.contactFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-blue hover:underline"
                        >
                          {draft.contactFormUrl}
                        </a>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted">—</p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    To
                  </label>
                  <p className="mt-1 text-sm text-brand">
                    {draft.toEmail || "—"}
                  </p>
                </div>
              )}

              {!isContactForm || subject.trim() ? (
                <div>
                  <label
                    htmlFor="outreach-subject"
                    className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
                  >
                    Subject
                  </label>
                  <Input
                    id="outreach-subject"
                    className="mt-1"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    disabled={!editable}
                  />
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="outreach-body"
                  className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
                >
                  {isContactForm ? "Message" : "Body"}
                </label>
                <Textarea
                  id="outreach-body"
                  className="mt-1 min-h-48"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  disabled={!editable}
                />
              </div>

              <p className="text-xs text-muted">
                Status: {draftStatusLabel(draft.status)}
                {draft.model ? ` · ${draft.model}` : ""}
              </p>

              {draft.approvedAt ? (
                <p className="text-xs text-muted">
                  Approved: {new Date(draft.approvedAt).toLocaleString()}{" "}
                  {draft.approvedByEmail ? `· ${draft.approvedByEmail}` : ""}
                </p>
              ) : null}

              {draft.sentAt ? (
                <p className="text-xs text-muted">
                  Sent: {new Date(draft.sentAt).toLocaleString()}
                </p>
              ) : null}

              {draft.submittedAt ? (
                <p className="text-xs text-muted">
                  Submitted: {new Date(draft.submittedAt).toLocaleString()}
                  {draft.submittedByEmail
                    ? ` · ${draft.submittedByEmail}`
                    : ""}
                </p>
              ) : null}

              {draft.error ? (
                <p className="text-xs text-red-700">{draft.error}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isPending || !editable}>
                  {isPending ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : null}
                  Save Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending || !editable}
                  onClick={() =>
                    run(() => generateProspectDraft(campaignId, prospectId, true))
                  }
                >
                  Regenerate Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending || !editable}
                  onClick={() =>
                    run(() =>
                      rejectOutreachDraft(campaignId, prospectId, draft.id),
                    )
                  }
                >
                  Reject Draft
                </Button>
                {canMarkApproved ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      run(() =>
                        approveOutreachDraft(campaignId, prospectId, draft.id),
                      )
                    }
                  >
                    Mark Approved
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {canSendEmail ? (
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Send this approved email to ${draft.toEmail}?`,
                        )
                      ) {
                        return;
                      }

                      run(() =>
                        sendOutreachMessage(campaignId, prospectId, draft.id),
                      );
                    }}
                  >
                    {isPending ? "Sending..." : "Send Approved Email"}
                  </Button>
                ) : null}

                {canMarkSubmitted ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending || !body.trim()}
                      onClick={copyMessage}
                    >
                      Copy Message
                    </Button>
                    {draft.contactFormUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        nativeButton={false}
                        render={
                          <a
                            href={draft.contactFormUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        Open Contact Form
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            "Confirm that you manually submitted this message through the prospect's website contact form.",
                          )
                        ) {
                          return;
                        }

                        run(() =>
                          markContactFormSubmitted(
                            campaignId,
                            prospectId,
                            draft.id,
                          ),
                        );
                      }}
                    >
                      Mark as Submitted
                    </Button>
                  </>
                ) : null}

                {draft.status === "APPROVED" &&
                isContactForm &&
                draft.contactFormUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    nativeButton={false}
                    render={
                      <a
                        href={draft.contactFormUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    Open Contact Form
                  </Button>
                ) : null}
              </div>
            </form>
          );
        })()
      ) : (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-muted">
            {canGenerate
              ? "No current draft. Generate one only after a public contact channel and audit finding are in place."
              : "This prospect is not ready for a draft."}
          </p>
          {canGenerate ? (
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                run(() => generateProspectDraft(campaignId, prospectId))
              }
            >
              {isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : null}
              Generate Draft
            </Button>
          ) : null}
        </div>
      )}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}
    </div>
  );
}
