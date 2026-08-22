"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createAgreementAction,
  reviseAgreementAction,
} from "@/app/reports/opportunities/agreement-actions";
import {
  prepareAgreementDeliveryAction,
  regenerateAgreementShareLinkAction,
  revokeAgreementAccessAction,
  sendAgreementDeliveryAction,
  updateAgreementDeliveryAction,
} from "@/app/reports/opportunities/agreement-delivery-actions";
import { Button } from "@/components/ui";
import type { LoadedAgreementSummary } from "@/lib/commercialization/agreement/load";
import type { LoadedAgreementDeliverySummary } from "@/lib/commercialization/agreement-delivery";

export interface OpportunityAgreementCardProps {
  opportunityId: string;
  proposalId: string;
  agreement: LoadedAgreementSummary | null;
  canCreate: boolean;
  blockedReason: string | null;
  proposalAccepted?: boolean;
  contactOptions: Array<{
    email: string;
    name: string | null;
    isPrimary: boolean;
  }>;
  deliveries: LoadedAgreementDeliverySummary[];
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

export function OpportunityAgreementCard({
  opportunityId,
  proposalId,
  agreement,
  canCreate,
  blockedReason,
  proposalAccepted = false,
  contactOptions,
  deliveries,
}: OpportunityAgreementCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [createOverrideReason, setCreateOverrideReason] = useState("");

  const activeDelivery = useMemo(
    () =>
      deliveries.find(
        (d) => d.isCurrentAgreement && !d.revokedAt && d.status !== "SENT",
      ) ??
      deliveries.find((d) => d.isCurrentAgreement && d.status === "SENT") ??
      null,
    [deliveries],
  );

  const primaryContact =
    contactOptions.find((c) => c.isPrimary) ?? contactOptions[0];

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

  const canDeliver =
    agreement?.status === "APPROVED" && !agreement.stale;

  const showOverrideField = !agreement && canCreate && !proposalAccepted;

  function refresh() {
    router.refresh();
  }

  function create() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createAgreementAction({
        opportunityId,
        proposalId,
        createOverrideReason: createOverrideReason.trim() || undefined,
      });
      if (!result.success) {
        setError(result.message ?? "Could not create Agreement.");
        if (result.agreementId) {
          router.push(
            `/reports/opportunities/${opportunityId}/agreement/${result.agreementId}`,
          );
        }
        return;
      }
      if (result.agreementId) {
        router.push(
          `/reports/opportunities/${opportunityId}/agreement/${result.agreementId}`,
        );
      }
    });
  }

  function revise() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await reviseAgreementAction({
        opportunityId,
        proposalId,
        createOverrideReason: createOverrideReason.trim() || undefined,
      });
      if (!result.success) {
        setError(result.message ?? "Could not revise Agreement.");
        return;
      }
      if (result.agreementId) {
        router.push(
          `/reports/opportunities/${opportunityId}/agreement/${result.agreementId}`,
        );
      }
    });
  }

  function prepare() {
    if (!agreement) {
      return;
    }
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await prepareAgreementDeliveryAction({
        opportunityId,
        agreementId: agreement.id,
        recipientName,
        recipientEmail,
      });
      if (!result.success) {
        setError(result.message ?? "Could not prepare delivery.");
        return;
      }
      setShareToken(result.shareToken ?? null);
      setShareUrl(result.shareUrl ?? null);
      setSubject((prev) => prev || "Agreement delivery");
      setBody((prev) =>
        result.shareUrl && !prev.includes(result.shareUrl)
          ? prev
            ? `${prev}\n\n${result.shareUrl}`
            : result.shareUrl
          : prev,
      );
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
      const result = await updateAgreementDeliveryAction({
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
      const result = await regenerateAgreementShareLinkAction({
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
      const result = await sendAgreementDeliveryAction({
        opportunityId,
        deliveryId: activeDelivery.id,
        shareToken,
      });
      if (!result.success) {
        setError(result.message ?? "Send failed.");
        return;
      }
      setMessage("Agreement sent.");
      refresh();
    });
  }

  function revoke() {
    if (!activeDelivery) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await revokeAgreementAccessAction({
        opportunityId,
        deliveryId: activeDelivery.id,
      });
      if (!result.success) {
        setError(result.message ?? "Could not revoke access.");
        return;
      }
      setShareToken(null);
      setShareUrl(null);
      setMessage("Agreement link revoked.");
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Agreement formalizes an approved Proposal for client acceptance. It does
        not change Scope, Pricing, or the Proposal. Client acceptance does not
        mark the Opportunity Won — payment and delivery are tracked separately.
      </p>

      {agreement?.status === "ACCEPTED" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p className="font-medium">Agreement Accepted — Payment Pending</p>
          <p className="mt-1 text-emerald-900/90">
            The client accepted this Agreement. Confirm payment separately
            before marking the Opportunity Won.
          </p>
          {agreement.acceptance ? (
            <p className="mt-2 text-xs text-emerald-900/80">
              Accepted {formatWhen(agreement.acceptance.acceptedAt)} by{" "}
              {agreement.acceptance.signerName} ({agreement.acceptance.signerEmail}
              ).
            </p>
          ) : null}
        </div>
      ) : null}

      {agreement ? (
        <div className="space-y-3 rounded-xl border border-border/80 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {agreement.statusLabel} · Revision {agreement.revision}
                {agreement.stale ? " · Stale" : " · Current"}
              </p>
              <p className="mt-1 text-sm text-ink">{agreement.title}</p>
              <p className="mt-1 text-sm text-ink">
                Total investment {agreement.totalInvestmentLabel}
              </p>
              <p className="mt-1 text-xs text-muted">
                {agreement.paymentTermLabel} · {agreement.paymentSummary}
              </p>
              {agreement.approvedAt ? (
                <p className="mt-1 text-xs text-muted">
                  Approved {formatWhen(agreement.approvedAt)}
                </p>
              ) : null}
              {agreement.stale ? (
                <p className="mt-1 text-xs text-amber-800">
                  Newer commercial inputs exist. Historical agreement is
                  unchanged — revise to snapshot current approved Proposal.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                nativeButton={false}
                render={
                  <Link
                    href={`/reports/opportunities/${opportunityId}/agreement/${agreement.id}`}
                  />
                }
              >
                {agreement.status === "APPROVED" ||
                agreement.status === "ACCEPTED"
                  ? "View Agreement"
                  : "Edit Agreement"}
              </Button>
              <Button
                type="button"
                variant="outline"
                nativeButton={false}
                render={
                  <Link
                    href={`/reports/opportunities/${opportunityId}/agreement/${agreement.id}?preview=1`}
                  />
                }
              >
                Preview
              </Button>
              {agreement.status === "APPROVED" ? (
                <Button type="button" disabled={isPending} onClick={revise}>
                  {isPending ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : null}
                  Revise
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            type="button"
            onClick={create}
            disabled={isPending || !canCreate}
          >
            {isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            Create Agreement
          </Button>
          {showOverrideField ? (
            <label className="block space-y-1 text-sm">
              <span className="text-xs font-medium text-muted">
                Override reason
              </span>
              <textarea
                className="min-h-20 w-full rounded-lg border border-border px-3 py-2"
                placeholder="Required when Proposal commercial intent is not Accepted"
                value={createOverrideReason}
                onChange={(e) => setCreateOverrideReason(e.target.value)}
              />
              <p className="text-xs text-muted">
                Record Proposal delivery as Accepted first, or explain why an
                Agreement is being created without that decision.
              </p>
            </label>
          ) : null}
          {blockedReason ? (
            <p className="text-xs text-muted">{blockedReason}</p>
          ) : null}
        </div>
      )}

      {agreement && canDeliver ? (
        <>
          <p className="text-sm text-muted">
            Delivery is explicit and human-controlled. Preparing a delivery does
            not send email. Client acceptance via the secure link does not mark
            the Opportunity Won.
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
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
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
                      Send Agreement
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

          {deliveries.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink">Delivery history</p>
              <ul className="space-y-2 text-sm text-muted">
                {deliveries.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-lg border border-border/60 px-3 py-2"
                  >
                    Revision {d.agreementRevision} · {d.statusLabel} ·{" "}
                    {d.recipientEmail} · {d.viewLabel}
                    {d.sentAt ? ` · Sent ${formatWhen(d.sentAt)}` : ""}
                    {d.revokedAt ? " · Revoked" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : agreement && agreement.status !== "ACCEPTED" ? (
        <p className="text-sm text-muted">
          Delivery requires an approved, current Agreement. Complete review and
          approval, or revise if stale.
        </p>
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
