"use client";

import { useMemo, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  prepareProposalDeliveryAction,
  recordProposalDecisionAction,
  regenerateProposalShareLinkAction,
  revokeProposalAccessAction,
  sendProposalDeliveryAction,
  updateProposalDeliveryAction,
} from "@/app/reports/opportunities/proposal-delivery-actions";
import { Button } from "@/components/ui";
import type { LoadedProposalDeliverySummary } from "@/lib/commercialization/proposal-delivery";
import type { ProposalDecision } from "@/lib/commercialization/proposal-delivery/constants";

export interface OpportunityProposalDeliveryCardProps {
  opportunityId: string;
  proposal: {
    id: string;
    status: string;
    revision: number;
    stale: boolean;
  };
  contactOptions: Array<{
    email: string;
    name: string | null;
    isPrimary: boolean;
  }>;
  deliveries: LoadedProposalDeliverySummary[];
}

function formatWhen(value: Date | null): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OpportunityProposalDeliveryCard({
  opportunityId,
  proposal,
  contactOptions,
  deliveries,
}: OpportunityProposalDeliveryCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeDelivery = useMemo(
    () =>
      deliveries.find(
        (d) => d.isCurrentProposal && !d.revokedAt && d.status !== "SENT",
      ) ??
      deliveries.find((d) => d.isCurrentProposal && d.status === "SENT") ??
      null,
    [deliveries],
  );

  const primaryContact = contactOptions.find((c) => c.isPrimary) ?? contactOptions[0];

  const [recipientName, setRecipientName] = useState(
    activeDelivery?.recipientName ?? primaryContact?.name ?? "",
  );
  const [recipientEmail, setRecipientEmail] = useState(
    activeDelivery?.recipientEmail ?? primaryContact?.email ?? "",
  );
  const [subject, setSubject] = useState(activeDelivery?.subject ?? "");
  const [body, setBody] = useState(activeDelivery?.message ?? "");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const canDeliver =
    proposal.status === "APPROVED" && !proposal.stale;

  function refresh() {
    router.refresh();
  }

  function prepare() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await prepareProposalDeliveryAction({
        opportunityId,
        proposalId: proposal.id,
        recipientName,
        recipientEmail,
      });
      if (!result.success) {
        setError(result.message ?? "Could not prepare delivery.");
        return;
      }
      setShareToken(result.shareToken ?? null);
      setShareUrl(result.shareUrl ?? null);
      setMessage(
        "Delivery prepared. Copy the secure link now — it is shown once unless regenerated.",
      );
      refresh();
    });
  }

  function save(markReady: boolean) {
    if (!activeDelivery) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateProposalDeliveryAction({
        opportunityId,
        deliveryId: activeDelivery.id,
        recipientName,
        recipientEmail,
        subject,
        message: body,
        markReady,
      });
      if (!result.success) {
        setError(result.message ?? "Could not update delivery.");
        return;
      }
      setMessage(result.message ?? "Saved.");
      refresh();
    });
  }

  function regenerateLink() {
    if (!activeDelivery) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await regenerateProposalShareLinkAction({
        opportunityId,
        deliveryId: activeDelivery.id,
      });
      if (!result.success) {
        setError(result.message ?? "Could not regenerate link.");
        return;
      }
      setShareToken(result.shareToken ?? null);
      setShareUrl(result.shareUrl ?? null);
      setBody((prev) =>
        result.shareUrl && !prev.includes(result.shareUrl)
          ? prev.replace(/\nhttps?:\/\/[^\s]+/g, "") + `\n\n${result.shareUrl}`
          : prev,
      );
      setMessage("New secure link generated.");
      refresh();
    });
  }

  async function copyLink() {
    const url = shareUrl;
    if (!url) {
      setError("Generate or prepare a delivery link first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Secure link copied.");
    } catch {
      setError("Could not copy link to clipboard.");
    }
  }

  function send() {
    if (!activeDelivery || !shareToken) {
      setError("Prepare delivery and keep the secure link before sending.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await sendProposalDeliveryAction({
        opportunityId,
        deliveryId: activeDelivery.id,
        shareToken,
      });
      if (!result.success) {
        setError(result.message ?? "Send failed.");
        return;
      }
      setMessage("Proposal sent.");
      refresh();
    });
  }

  function revoke() {
    if (!activeDelivery) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await revokeProposalAccessAction({
        opportunityId,
        deliveryId: activeDelivery.id,
      });
      if (!result.success) {
        setError(result.message ?? "Could not revoke access.");
        return;
      }
      setShareToken(null);
      setShareUrl(null);
      setMessage("Proposal link revoked.");
      refresh();
    });
  }

  function recordDecision(decision: ProposalDecision) {
    const target =
      deliveries.find((d) => d.isCurrentProposal && d.status === "SENT") ??
      activeDelivery;
    if (!target) {
      setError("No delivery available to record a decision against.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await recordProposalDecisionAction({
        opportunityId,
        deliveryId: target.id,
        decision,
        note: decisionNote || null,
      });
      if (!result.success) {
        setError(result.message ?? "Could not record decision.");
        return;
      }
      setMessage("Client decision recorded.");
      setDecisionNote("");
      refresh();
    });
  }

  if (!canDeliver) {
    return (
      <p className="text-sm text-muted">
        Delivery requires an approved, current Proposal. Revise the Proposal if
        it is stale.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Delivery is explicit and human-controlled. Preparing a delivery does not
        send email. Accepted means communicated intent to proceed — not a signed
        agreement, payment, or Won stage.
      </p>

      {!activeDelivery ? (
        <div className="space-y-3 rounded-xl border border-border/80 p-4">
          <p className="text-sm font-medium text-ink">Prepare delivery</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted">Recipient name</span>
              <input
                className="w-full rounded-lg border border-border px-3 py-2"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted">Recipient email</span>
              <input
                className="w-full rounded-lg border border-border px-3 py-2"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </label>
          </div>
          {contactOptions.length > 0 ? (
            <p className="text-xs text-muted">
              Prospect contacts are suggestions only — confirm the recipient
              explicitly.
            </p>
          ) : null}
          <Button type="button" disabled={isPending} onClick={prepare}>
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Prepare Delivery
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-border/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink">
              Delivery · {activeDelivery.statusLabel}
              {activeDelivery.revokedAt ? " · Revoked" : ""}
            </p>
            <p className="text-xs text-muted">{activeDelivery.viewLabel}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted">Recipient name</span>
              <input
                className="w-full rounded-lg border border-border px-3 py-2"
                value={recipientName || activeDelivery.recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                disabled={activeDelivery.status === "SENT"}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted">Recipient email</span>
              <input
                className="w-full rounded-lg border border-border px-3 py-2"
                type="email"
                value={recipientEmail || activeDelivery.recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={activeDelivery.status === "SENT"}
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-muted">Subject</span>
            <input
              className="w-full rounded-lg border border-border px-3 py-2"
              value={subject || activeDelivery.subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={activeDelivery.status === "SENT"}
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-muted">Message</span>
            <textarea
              className="min-h-40 w-full rounded-lg border border-border px-3 py-2"
              value={body || activeDelivery.message}
              onChange={(e) => setBody(e.target.value)}
              disabled={activeDelivery.status === "SENT"}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {activeDelivery.status !== "SENT" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => save(false)}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => save(true)}
                >
                  Mark Ready
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={regenerateLink}
                >
                  Regenerate Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={copyLink}
                >
                  Copy Secure Link
                </Button>
                <Button type="button" disabled={isPending} onClick={send}>
                  Send Proposal
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={revoke}
                >
                  Revoke Link
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted">
                Sent {formatWhen(activeDelivery.sentAt)} to{" "}
                {activeDelivery.recipientEmail}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-border/80 p-4">
        <p className="text-sm font-medium text-ink">Record client decision</p>
        <p className="text-xs text-muted">
          Human-recorded commercial state. Does not mark the Opportunity Won or
          Lost automatically.
        </p>
        <textarea
          className="min-h-20 w-full rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="Optional note (bounded)"
          value={decisionNote}
          onChange={(e) => setDecisionNote(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              "INTERESTED",
              "CHANGES_REQUESTED",
              "DECLINED",
              "ACCEPTED",
            ] as ProposalDecision[]
          ).map((decision) => (
            <Button
              key={decision}
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => recordDecision(decision)}
            >
              {decision.replaceAll("_", " ").toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {deliveries.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">Delivery history</p>
          <ul className="space-y-2 text-sm text-muted">
            {deliveries.map((d) => (
              <li
                key={d.id}
                className="rounded-lg border border-border/60 px-3 py-2"
              >
                Revision {d.proposalRevision} · {d.statusLabel} ·{" "}
                {d.recipientEmail} · {d.viewLabel}
                {d.sentAt ? ` · Sent ${formatWhen(d.sentAt)}` : ""}
                {d.revokedAt ? " · Revoked" : ""}
                {d.decision !== "PENDING" ? ` · ${d.decisionLabel}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
    </div>
  );
}
