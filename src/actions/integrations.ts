"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getIntegration, hasActiveIntegration } from "@/lib/integrations/oauth";
import { getProviderAdapter, type CRMProvider } from "@/lib/integrations/providers";
import { decrypt } from "@/lib/integrations/encryption";
import { runInitialSync, runIncrementalSync } from "@/lib/integrations/sync";
import {
  isDemoMode,
  createDemoIntegration,
  simulateDemoSync,
} from "@/lib/integrations/demo";

export interface IntegrationStatus {
  connected: boolean;
  provider?: string;
  status?: string;
  lastSyncAt?: Date | null;
  lastSyncStatus?: string | null;
  lastSyncError?: string | null;
  isDemo?: boolean;
  recentSyncLogs?: Array<{
    id: string;
    entityType: string;
    operation: string;
    direction: string;
    status: string;
    recordsProcessed: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsFailed: number;
    startedAt: Date;
    completedAt: Date | null;
  }>;
}

/**
 * Get the current integration status for the organization
 */
export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return { connected: false };
  }

  const integration = await getIntegration(session.user.organizationId);

  if (!integration) {
    return { connected: false };
  }

  // Check if this is a demo integration
  const isDemo = integration.accessToken === "demo-access-token-not-real";

  return {
    connected: true,
    provider: integration.provider,
    status: integration.status,
    lastSyncAt: integration.lastSyncAt,
    lastSyncStatus: integration.lastSyncStatus,
    lastSyncError: integration.lastSyncError,
    isDemo,
    recentSyncLogs: integration.syncLogs.map((log) => ({
      id: log.id,
      entityType: log.entityType,
      operation: log.operation,
      direction: log.direction,
      status: log.status,
      recordsProcessed: log.recordsProcessed,
      recordsCreated: log.recordsCreated,
      recordsUpdated: log.recordsUpdated,
      recordsFailed: log.recordsFailed,
      startedAt: log.startedAt,
      completedAt: log.completedAt,
    })),
  };
}

/**
 * Check if the organization has an active CRM integration
 */
export async function checkIntegration(): Promise<{
  hasIntegration: boolean;
  provider?: string;
  status?: string;
}> {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return { hasIntegration: false };
  }

  const integration = await prisma.cRMIntegration.findUnique({
    where: { organizationId: session.user.organizationId },
    select: { provider: true, status: true },
  });

  if (!integration) {
    return { hasIntegration: false };
  }

  return {
    hasIntegration: true,
    provider: integration.provider,
    status: integration.status,
  };
}

/**
 * Trigger a manual sync
 */
export async function triggerSync(): Promise<{ success: boolean; error?: string }> {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const integration = await prisma.cRMIntegration.findUnique({
    where: { organizationId: session.user.organizationId },
  });

  if (!integration || integration.status !== "CONNECTED") {
    return { success: false, error: "No active integration" };
  }

  try {
    // Check if this is a demo integration
    const isDemo = integration.accessToken === "demo-access-token-not-real";

    if (isDemo) {
      // Use demo sync simulation
      await simulateDemoSync(session.user.organizationId);
    } else {
      // Check if this is the first sync
      const hasSyncedBefore = integration.lastSyncAt !== null;

      if (hasSyncedBefore) {
        await runIncrementalSync(session.user.organizationId);
      } else {
        await runInitialSync(session.user.organizationId);
      }
    }

    revalidatePath("/integrations");
    revalidatePath("/leads");
    revalidatePath("/contacts");
    revalidatePath("/companies");
    revalidatePath("/deals");

    return { success: true };
  } catch (error) {
    console.error("Sync failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
}

/**
 * Disconnect the CRM integration
 */
export async function disconnectIntegration(): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const integration = await prisma.cRMIntegration.findUnique({
    where: { organizationId: session.user.organizationId },
  });

  if (!integration) {
    return { success: false, error: "No integration found" };
  }

  try {
    // Try to delete webhook subscription in CRM
    if (integration.webhookId && integration.webhookId !== "manual-setup-required") {
      try {
        const adapter = getProviderAdapter(integration.provider as CRMProvider);
        const accessToken = decrypt(integration.accessToken);
        await adapter.deleteWebhook(
          accessToken,
          integration.webhookId,
          integration.instanceUrl || undefined
        );
      } catch (webhookError) {
        console.warn("Failed to delete webhook:", webhookError);
        // Continue with disconnection even if webhook deletion fails
      }
    }

    // Delete the integration record
    await prisma.cRMIntegration.delete({
      where: { id: integration.id },
    });

    // Clear external references from all synced recipients
    // Keep the data but mark as no longer synced
    await prisma.recipient.updateMany({
      where: {
        organizationId: session.user.organizationId,
        externalId: { not: null },
      },
      data: {
        externalId: null,
        externalSource: null,
        externalUrl: null,
        syncStatus: null,
        lastSyncedAt: null,
      },
    });

    revalidatePath("/integrations");
    revalidatePath("/leads");
    revalidatePath("/contacts");
    revalidatePath("/companies");
    revalidatePath("/deals");

    return { success: true };
  } catch (error) {
    console.error("Disconnect failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Disconnect failed",
    };
  }
}

/**
 * Connect a demo CRM integration
 */
export async function connectDemoIntegration(
  provider: "hubspot" | "salesforce" | "attio"
): Promise<{ success: boolean; error?: string }> {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  if (!isDemoMode()) {
    return { success: false, error: "Demo mode is not enabled" };
  }

  try {
    await createDemoIntegration(session.user.organizationId, provider);

    revalidatePath("/integrations");
    revalidatePath("/leads");
    revalidatePath("/contacts");
    revalidatePath("/companies");
    revalidatePath("/deals");

    return { success: true };
  } catch (error) {
    console.error("Demo connection failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Get sync logs for the integration
 */
export async function getSyncLogs(limit = 20) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const integration = await prisma.cRMIntegration.findUnique({
    where: { organizationId: session.user.organizationId },
  });

  if (!integration) {
    return [];
  }

  return prisma.syncLog.findMany({
    where: { integrationId: integration.id },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}
