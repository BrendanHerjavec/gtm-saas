import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProviderAdapter, isValidProvider, type CRMProvider } from "@/lib/integrations/providers";
import { getValidAccessToken } from "@/lib/integrations/oauth";
import { mapExternalToLocal } from "@/lib/integrations/mappers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;

    if (!isValidProvider(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const body = await request.text();
    const adapter = getProviderAdapter(provider);

    // Get signature header based on provider
    const signature = getSignatureHeader(request, provider);

    // Find integration that matches this webhook
    const integration = await findIntegrationForWebhook(provider, body, signature);

    if (!integration) {
      console.warn(`No matching integration found for ${provider} webhook`);
      // Return 200 to prevent retries for webhooks we don't handle
      return NextResponse.json({ received: true, processed: false });
    }

    // Verify signature if we have a secret
    if (integration.webhookSecret && signature) {
      const isValid = adapter.verifyWebhookSignature(
        body,
        signature,
        integration.webhookSecret
      );

      if (!isValid) {
        console.error(`Invalid webhook signature for ${provider}`);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Parse webhook payload
    const events = adapter.parseWebhookPayload(JSON.parse(body));

    // Process each event
    for (const event of events) {
      await processWebhookEvent(integration, event, adapter);
    }

    return NextResponse.json({ received: true, processed: events.length });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 200 to prevent infinite retries
    return NextResponse.json({ received: true, error: "Processing failed" });
  }
}

function getSignatureHeader(request: NextRequest, provider: string): string | null {
  switch (provider) {
    case "hubspot":
      return request.headers.get("x-hubspot-signature-v3") ||
             request.headers.get("x-hubspot-signature");
    case "salesforce":
      return request.headers.get("x-salesforce-signature");
    case "attio":
      return request.headers.get("x-attio-signature") ||
             request.headers.get("attio-signature");
    default:
      return null;
  }
}

async function findIntegrationForWebhook(
  provider: string,
  _body: string,
  _signature: string | null
) {
  // Find all integrations for this provider
  // In production, you'd want to match by webhook ID or organization ID in the payload
  const integrations = await prisma.cRMIntegration.findMany({
    where: {
      provider,
      status: "CONNECTED",
    },
  });

  // For now, return the first matching integration
  // In production, implement proper matching based on webhook payload
  return integrations[0] || null;
}

async function processWebhookEvent(
  integration: {
    id: string;
    organizationId: string;
    provider: string;
    webhookSecret: string | null;
  },
  event: {
    entityType: "lead" | "contact" | "company" | "deal";
    action: "create" | "update" | "delete";
    externalId: string;
    data?: unknown;
  },
  adapter: ReturnType<typeof getProviderAdapter>
) {
  // Create sync log
  const syncLog = await prisma.syncLog.create({
    data: {
      integrationId: integration.id,
      entityType: event.entityType,
      operation: "webhook",
      direction: "inbound",
      status: "started",
      metadata: JSON.stringify({ action: event.action, externalId: event.externalId }),
    },
  });

  try {
    if (event.action === "delete") {
      // Mark local record as deleted (soft delete by clearing external reference)
      await markRecordDeleted(
        integration.organizationId,
        event.entityType,
        event.externalId
      );
    } else {
      // Fetch full record from CRM if not provided
      const { accessToken, instanceUrl } = await getValidAccessToken(
        integration.organizationId
      );

      const record = event.data
        ? (event.data as { id: string; properties: Record<string, unknown> })
        : await adapter.fetchRecord(
            event.entityType,
            accessToken,
            event.externalId,
            instanceUrl || undefined
          );

      if (record) {
        const mapped = mapExternalToLocal(
          integration.provider as CRMProvider,
          event.entityType,
          record,
          instanceUrl || undefined
        );

        await upsertFromWebhook(
          integration.organizationId,
          event.entityType,
          mapped as unknown as Record<string, unknown>
        );
      }
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        recordsProcessed: 1,
        recordsUpdated: event.action === "delete" ? 0 : 1,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage,
        recordsFailed: 1,
      },
    });

    throw error;
  }
}

async function markRecordDeleted(
  organizationId: string,
  entityType: string,
  externalId: string
) {
  const table = getTableName(entityType);

  // Clear external reference instead of deleting
  // This preserves local data while marking as disconnected
  await (prisma as any)[table].updateMany({
    where: {
      organizationId,
      externalId,
    },
    data: {
      externalId: null,
      externalSource: null,
      externalUrl: null,
      syncStatus: null,
    },
  });
}

async function upsertFromWebhook(
  organizationId: string,
  entityType: string,
  mapped: Record<string, unknown>
) {
  const table = getTableName(entityType);
  const externalId = mapped.externalId as string;
  const externalSource = mapped.externalSource as string;

  const existing = await (prisma as any)[table].findFirst({
    where: {
      organizationId,
      externalId,
      externalSource,
    },
    select: { id: true },
  });

  const { externalId: _extId, externalSource: _extSource, ...updateData } = mapped;

  if (existing) {
    await (prisma as any)[table].update({
      where: { id: existing.id },
      data: {
        ...updateData,
        syncStatus: "SYNCED",
      },
    });
  } else {
    // For creates, we need entity-specific handling due to required fields
    // This is simplified - full implementation would mirror sync/index.ts
    await (prisma as any)[table].create({
      data: {
        organizationId,
        ...mapped,
        syncStatus: "SYNCED",
      },
    });
  }
}

function getTableName(_entityType: string): string {
  // All CRM entity types map to the recipient table
  return "recipient";
}
