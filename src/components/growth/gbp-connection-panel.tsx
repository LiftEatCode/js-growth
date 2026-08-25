"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";

import {
  disconnectGbpAction,
  loadGbpLocationsAction,
  selectGbpLocationAction,
  syncGbpAllAction,
  syncGbpPerformanceAction,
  syncGbpProfileAction,
  type GbpSyncActionState,
} from "@/app/reports/growth/local/actions";
import { Button } from "@/components/ui";
import type { GbpConnectionPanelModel } from "@/lib/gbp/connection-store";

const initial: GbpSyncActionState = { success: false, message: "" };

export function GbpConnectionPanel({
  model,
}: {
  model: GbpConnectionPanelModel;
}) {
  const router = useRouter();
  const [profileState, profileAction] = useActionState(
    syncGbpProfileAction,
    initial,
  );
  const [perfState, perfAction] = useActionState(
    syncGbpPerformanceAction,
    initial,
  );
  const [allState, allAction] = useActionState(syncGbpAllAction, initial);
  const [disconnectState, disconnectAction] = useActionState(
    disconnectGbpAction,
    initial,
  );
  const [selectState, selectAction] = useActionState(
    selectGbpLocationAction,
    initial,
  );
  const [pending, startTransition] = useTransition();
  const [locations, setLocations] = useState<
    Array<{
      resourceName: string;
      locationId: string;
      title: string;
      accountId: string;
      accountResourceName?: string;
      accountDisplayName?: string;
    }>
  >([]);
  const [loadMessage, setLoadMessage] = useState("");

  const needsLocation =
    (model.uiState === "CONNECTED" ||
      model.uiState === "SYNCED" ||
      model.uiState === "ERROR") &&
    !model.hasLocation;

  useEffect(() => {
    if (!needsLocation) return;
    startTransition(async () => {
      const result = await loadGbpLocationsAction();
      if (!result.success) {
        setLoadMessage(result.message);
        return;
      }
      const accountById = new Map(
        (result.accounts ?? []).map((a) => [a.accountId, a]),
      );
      setLocations(
        (result.locations ?? []).map((loc) => ({
          ...loc,
          accountResourceName: accountById.get(loc.accountId)?.resourceName,
          accountDisplayName: accountById.get(loc.accountId)?.accountName,
        })),
      );
    });
  }, [needsLocation]);

  useEffect(() => {
    if (
      selectState.success ||
      profileState.success ||
      perfState.success ||
      allState.success ||
      disconnectState.success
    ) {
      router.refresh();
    }
  }, [
    selectState.success,
    selectState.message,
    profileState.success,
    profileState.message,
    perfState.success,
    perfState.message,
    allState.success,
    allState.message,
    disconnectState.success,
    disconnectState.message,
    router,
  ]);

  return (
    <div
      className="space-y-4 rounded-2xl border border-border bg-white p-6"
      data-testid="gbp-connection-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand">
            Google Business Profile · Read Integration v
            {model.readIntegrationVersion}
          </p>
          <p className="text-xs text-muted">
            Status:{" "}
            <span className="font-mono" data-testid="gbp-connection-status">
              {model.uiState}
            </span>
            {model.locationTitle ? ` · Location: ${model.locationTitle}` : ""}
            {model.accountDisplayName
              ? ` · Account: ${model.accountDisplayName}`
              : ""}
          </p>
          <p className="text-xs text-muted">
            Last profile sync:{" "}
            {model.lastProfileSyncAt ?? "NOT_CAPTURED"} · Last performance sync:{" "}
            {model.lastPerformanceSyncAt ?? "NOT_CAPTURED"}
          </p>
          <p className="text-xs text-muted">
            Dashboard load makes zero Google API calls. Explicit Sync only. No
            automatic profile writes.
          </p>
        </div>
      </div>

      {model.uiState === "NOT_CONFIGURED" ? (
        <p className="text-sm text-muted" data-testid="gbp-not-configured">
          Set GOOGLE_GBP_CLIENT_ID, GOOGLE_GBP_CLIENT_SECRET, and
          GOOGLE_GBP_REDIRECT_URI (or NEXT_PUBLIC_SITE_URL) to enable Connect.
        </p>
      ) : null}

      {model.uiState === "NOT_CONNECTED" ||
      model.uiState === "DISCONNECTED" ||
      model.uiState === "AUTH_EXPIRED" ? (
        <Button
          nativeButton={false}
          render={
            <Link
              href="/api/gbp/oauth/start"
              data-testid="gbp-connect-button"
            />
          }
        >
          {model.uiState === "AUTH_EXPIRED"
            ? "Reconnect Google Business Profile"
            : "Connect Google Business Profile"}
        </Button>
      ) : null}

      {needsLocation ? (
        <div className="space-y-2" data-testid="gbp-location-picker">
          <p className="text-sm font-medium">Select location</p>
          {loadMessage ? (
            <p className="text-xs text-red-700">{loadMessage}</p>
          ) : null}
          {locations.map((loc) => (
            <form
              key={loc.resourceName}
              action={(fd) => {
                startTransition(() => {
                  selectAction(fd);
                });
              }}
              className="flex flex-wrap items-center gap-2"
            >
              <input
                type="hidden"
                name="accountResourceName"
                value={loc.accountResourceName ?? `accounts/${loc.accountId}`}
              />
              <input
                type="hidden"
                name="accountDisplayName"
                value={loc.accountDisplayName ?? loc.accountId}
              />
              <input type="hidden" name="accountId" value={loc.accountId} />
              <input
                type="hidden"
                name="locationResourceName"
                value={loc.resourceName}
              />
              <input type="hidden" name="locationTitle" value={loc.title} />
              <input type="hidden" name="locationId" value={loc.locationId} />
              <Button
                type="submit"
                disabled={pending}
                data-testid={`gbp-select-location-${loc.locationId}`}
              >
                Select {loc.title}
              </Button>
            </form>
          ))}
          {selectState.message ? (
            <p className="text-xs text-muted">{selectState.message}</p>
          ) : null}
        </div>
      ) : null}

      {model.hasLocation &&
      model.uiState !== "NOT_CONNECTED" &&
      model.uiState !== "DISCONNECTED" &&
      model.uiState !== "NOT_CONFIGURED" ? (
        <div className="flex flex-wrap gap-2">
          <form
            action={(fd) => {
              startTransition(() => {
                profileAction(fd);
              });
            }}
          >
            <Button
              type="submit"
              disabled={pending}
              data-testid="gbp-sync-profile"
            >
              Sync Profile
            </Button>
          </form>
          <form
            action={(fd) => {
              startTransition(() => {
                perfAction(fd);
              });
            }}
          >
            <Button
              type="submit"
              disabled={pending}
              data-testid="gbp-sync-performance"
            >
              Sync Performance
            </Button>
          </form>
          <form
            action={(fd) => {
              startTransition(() => {
                allAction(fd);
              });
            }}
          >
            <Button type="submit" disabled={pending} data-testid="gbp-sync-all">
              Sync All
            </Button>
          </form>
          <form
            action={(fd) => {
              startTransition(() => {
                disconnectAction(fd);
              });
            }}
          >
            <Button
              type="submit"
              disabled={pending}
              data-testid="gbp-disconnect"
            >
              Disconnect
            </Button>
          </form>
        </div>
      ) : null}

      <div className="space-y-1 text-xs text-muted" data-testid="gbp-sync-messages">
        {profileState.message ? <p>{profileState.message}</p> : null}
        {perfState.message ? <p>{perfState.message}</p> : null}
        {allState.message ? <p>{allState.message}</p> : null}
        {disconnectState.message ? <p>{disconnectState.message}</p> : null}
        {model.lastSyncError ? (
          <p className="text-red-700">Last error: {model.lastSyncError}</p>
        ) : null}
      </div>
    </div>
  );
}
