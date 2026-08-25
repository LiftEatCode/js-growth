import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import {
  GBP_OAUTH_SCOPE,
  type GbpConnectionUiState,
} from "@/lib/gbp/constants";
import { getGbpOAuthConfig, isGbpMockMode } from "@/lib/gbp/config";
import {
  decryptRefreshToken,
  encryptRefreshToken,
} from "@/lib/gbp/crypto";
import { prisma } from "@/lib/prisma";

export async function getActiveGbpConnection() {
  try {
    return await prisma.googleBusinessProfileConnection.findFirst({
      where: {
        status: { in: ["CONNECTED", "SYNCING", "SYNCED", "AUTH_EXPIRED", "ERROR"] },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return null;
  }
}

export function resolveGbpConnectionUiState(
  row: Awaited<ReturnType<typeof getActiveGbpConnection>>,
): GbpConnectionUiState {
  const config = getGbpOAuthConfig();
  if (!config.configured && !isGbpMockMode()) {
    return "NOT_CONFIGURED";
  }
  if (!row || row.status === "DISCONNECTED") {
    return "NOT_CONNECTED";
  }
  if (row.status === "AUTH_EXPIRED") return "AUTH_EXPIRED";
  if (row.status === "ERROR") return "ERROR";
  if (row.status === "SYNCING") return "SYNCING";
  if (row.status === "SYNCED") return "SYNCED";
  return "CONNECTED";
}

export async function upsertGbpConnectionAfterOAuth(input: {
  refreshToken: string;
  scopes?: string;
  operatorEmail: string;
}): Promise<{ id: string }> {
  const encrypted = encryptRefreshToken(input.refreshToken);
  // Reuse active or most recent disconnected row (avoid connection row churn on reconnect).
  const existing =
    (await getActiveGbpConnection()) ??
    (await prisma.googleBusinessProfileConnection.findFirst({
      orderBy: { updatedAt: "desc" },
    }));
  const scopesJson = {
    scopes: (input.scopes ?? GBP_OAUTH_SCOPE).split(/\s+/).filter(Boolean),
  };

  if (existing) {
    const updated = await prisma.googleBusinessProfileConnection.update({
      where: { id: existing.id },
      data: {
        status: "CONNECTED",
        encryptedRefreshToken: encrypted.ciphertext,
        tokenIv: encrypted.iv,
        tokenAuthTag: encrypted.authTag,
        scopesJson: scopesJson as Prisma.InputJsonValue,
        connectedByEmail: input.operatorEmail,
        connectedAt: new Date(),
        lastSyncError: null,
      },
    });
    return { id: updated.id };
  }

  const created = await prisma.googleBusinessProfileConnection.create({
    data: {
      status: "CONNECTED",
      encryptedRefreshToken: encrypted.ciphertext,
      tokenIv: encrypted.iv,
      tokenAuthTag: encrypted.authTag,
      scopesJson: scopesJson as Prisma.InputJsonValue,
      connectedByEmail: input.operatorEmail,
      connectedAt: new Date(),
    },
  });
  return { id: created.id };
}

export async function selectGbpLocation(input: {
  connectionId: string;
  accountResourceName: string;
  accountDisplayName: string;
  accountId: string;
  locationResourceName: string;
  locationTitle: string;
  locationId: string;
}): Promise<void> {
  await prisma.googleBusinessProfileConnection.update({
    where: { id: input.connectionId },
    data: {
      googleAccountResourceName: input.accountResourceName,
      googleAccountDisplayName: input.accountDisplayName,
      googleAccountId: input.accountId,
      locationResourceName: input.locationResourceName,
      locationTitle: input.locationTitle,
      googleLocationId: input.locationId,
      status: "CONNECTED",
      lastSyncError: null,
    },
  });
}

export function getDecryptedRefreshToken(row: {
  encryptedRefreshToken: string | null;
  tokenIv: string | null;
  tokenAuthTag: string | null;
}): string | null {
  if (!row.encryptedRefreshToken || !row.tokenIv || !row.tokenAuthTag) {
    return null;
  }
  return decryptRefreshToken({
    ciphertext: row.encryptedRefreshToken,
    iv: row.tokenIv,
    authTag: row.tokenAuthTag,
  });
}

export async function disconnectGbpConnection(
  connectionId: string,
): Promise<void> {
  await prisma.googleBusinessProfileConnection.update({
    where: { id: connectionId },
    data: {
      status: "DISCONNECTED",
      encryptedRefreshToken: null,
      tokenIv: null,
      tokenAuthTag: null,
      syncLockUntil: null,
      syncLockOperation: null,
      lastSyncError: null,
      // Preserve location labels for audit, clear live identity optional — keep for history
    },
  });
}

const LOCK_MS = 60_000;

export async function acquireGbpSyncLock(
  connectionId: string,
  operation: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.googleBusinessProfileConnection.findUnique({
    where: { id: connectionId },
  });
  if (!row) return { ok: false, error: "Connection not found" };
  if (row.syncLockUntil && row.syncLockUntil.getTime() > Date.now()) {
    return {
      ok: false,
      error: `Sync already in progress (${row.syncLockOperation ?? "unknown"})`,
    };
  }
  await prisma.googleBusinessProfileConnection.update({
    where: { id: connectionId },
    data: {
      status: "SYNCING",
      syncLockUntil: new Date(Date.now() + LOCK_MS),
      syncLockOperation: operation,
      lastSyncOperation: operation,
      lastSyncStatus: "STARTED",
      lastSyncError: null,
    },
  });
  return { ok: true };
}

export async function releaseGbpSyncLock(
  connectionId: string,
  result: {
    status: "SYNCED" | "ERROR" | "AUTH_EXPIRED";
    error?: string | null;
    summary?: Record<string, unknown>;
    profileSynced?: boolean;
    performanceSynced?: boolean;
  },
): Promise<void> {
  await prisma.googleBusinessProfileConnection.update({
    where: { id: connectionId },
    data: {
      status: result.status === "SYNCED" ? "SYNCED" : result.status,
      syncLockUntil: null,
      syncLockOperation: null,
      lastSyncStatus: result.status,
      lastSyncError: result.error?.slice(0, 500) ?? null,
      lastSyncSummaryJson: (result.summary ?? null) as Prisma.InputJsonValue,
      ...(result.profileSynced
        ? { lastProfileSyncAt: new Date() }
        : {}),
      ...(result.performanceSynced
        ? { lastPerformanceSyncAt: new Date() }
        : {}),
    },
  });
}

export type GbpConnectionPanelModel = {
  uiState: GbpConnectionUiState;
  locationTitle: string | null;
  accountDisplayName: string | null;
  lastProfileSyncAt: string | null;
  lastPerformanceSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  hasLocation: boolean;
  connectionId: string | null;
  readIntegrationVersion: number;
};

export async function getGbpConnectionPanelModel(): Promise<GbpConnectionPanelModel> {
  const row = await getActiveGbpConnection();
  const uiState = resolveGbpConnectionUiState(row);
  return {
    uiState,
    locationTitle: row?.locationTitle ?? null,
    accountDisplayName: row?.googleAccountDisplayName ?? null,
    lastProfileSyncAt: row?.lastProfileSyncAt?.toISOString() ?? null,
    lastPerformanceSyncAt: row?.lastPerformanceSyncAt?.toISOString() ?? null,
    lastSyncStatus: row?.lastSyncStatus ?? null,
    lastSyncError: row?.lastSyncError ?? null,
    hasLocation: Boolean(row?.locationResourceName && row?.googleLocationId),
    connectionId: row?.id ?? null,
    readIntegrationVersion: 1,
  };
}
