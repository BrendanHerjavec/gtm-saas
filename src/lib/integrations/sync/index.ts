import { prisma } from "@/lib/prisma";
import { getValidAccessToken, getIntegration } from "../oauth";
import { getProviderAdapter, type CRMProvider, type EntityType } from "../providers";
import { mapExternalToLocal } from "../mappers";
import type {
  MappedLead,
  MappedContact,
  MappedCompany,
  MappedDeal,
} from "../providers/types";

interface SyncResult {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

/**
 * Run a full initial sync for an organization
 */
export async function runInitialSync(organizationId: string): Promise<void> {
  const integration = await getIntegration(organizationId);
  if (!integration) {
    throw new Error("No integration found");
  }

  // Create sync log
  const syncLog = await prisma.syncLog.create({
    data: {
      integrationId: integration.id,
      entityType: "all",
      operation: "full_sync",
      direction: "inbound",
      status: "started",
    },
  });

  // Update integration status
  await prisma.cRMIntegration.update({
    where: { id: integration.id },
    data: { status: "SYNCING" },
  });

  try {
    const { accessToken, instanceUrl } = await getValidAccessToken(organizationId);
    const adapter = getProviderAdapter(integration.provider as CRMProvider);

    const results: Record<EntityType, SyncResult> = {
      company: { processed: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
      contact: { processed: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
      lead: { processed: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
      deal: { processed: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
    };

    // Sync in order: Companies -> Contacts -> Leads -> Deals
    // This ensures foreign key relationships can be established
    const entityOrder: EntityType[] = ["company", "contact", "lead", "deal"];

    for (const entityType of entityOrder) {
      let cursor: string | null = null;

      do {
        const { records, nextCursor } = await adapter.fetchRecords(
          entityType,
          accessToken,
          { cursor, limit: 100 },
          instanceUrl || undefined
        );

        for (const record of records) {
          try {
            const mapped = mapExternalToLocal(
              integration.provider as CRMProvider,
              entityType,
              record,
              instanceUrl || undefined
            );

            const result = await upsertRecord(
              organizationId,
              entityType,
              mapped
            );

            results[entityType].processed++;
            if (result === "created") results[entityType].created++;
            if (result === "updated") results[entityType].updated++;
            if (result === "skipped") results[entityType].skipped++;
          } catch (error) {
            console.error(`Failed to sync ${entityType} ${record.id}:`, error);
            results[entityType].failed++;
          }
        }

        cursor = nextCursor;
      } while (cursor);
    }

    // Calculate totals
    const totals = Object.values(results).reduce(
      (acc, r) => ({
        processed: acc.processed + r.processed,
        created: acc.created + r.created,
        updated: acc.updated + r.updated,
        skipped: acc.skipped + r.skipped,
        failed: acc.failed + r.failed,
      }),
      { processed: 0, created: 0, updated: 0, skipped: 0, failed: 0 }
    );

    // Update sync log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        recordsProcessed: totals.processed,
        recordsCreated: totals.created,
        recordsUpdated: totals.updated,
        recordsSkipped: totals.skipped,
        recordsFailed: totals.failed,
        metadata: JSON.stringify(results),
      },
    });

    // Update integration status
    await prisma.cRMIntegration.update({
      where: { id: integration.id },
      data: {
        status: "CONNECTED",
        lastSyncAt: new Date(),
        lastSyncStatus: totals.failed > 0 ? "PARTIAL" : "SUCCESS",
        lastSyncError: null,
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
      },
    });

    await prisma.cRMIntegration.update({
      where: { id: integration.id },
      data: {
        status: "ERROR",
        lastSyncStatus: "FAILED",
        lastSyncError: errorMessage,
      },
    });

    throw error;
  }
}

/**
 * Run an incremental sync for records modified since last sync
 */
export async function runIncrementalSync(organizationId: string): Promise<void> {
  const integration = await getIntegration(organizationId);
  if (!integration || integration.status !== "CONNECTED") {
    return;
  }

  const lastSyncAt = integration.lastSyncAt || new Date(0);

  const syncLog = await prisma.syncLog.create({
    data: {
      integrationId: integration.id,
      entityType: "all",
      operation: "incremental",
      direction: "inbound",
      status: "started",
    },
  });

  try {
    const { accessToken, instanceUrl } = await getValidAccessToken(organizationId);
    const adapter = getProviderAdapter(integration.provider as CRMProvider);

    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    const entityTypes: EntityType[] = ["company", "contact", "lead", "deal"];

    for (const entityType of entityTypes) {
      const records = await adapter.fetchRecordsModifiedSince(
        entityType,
        accessToken,
        lastSyncAt,
        instanceUrl || undefined
      );

      for (const record of records) {
        try {
          const mapped = mapExternalToLocal(
            integration.provider as CRMProvider,
            entityType,
            record,
            instanceUrl || undefined
          );

          const result = await upsertRecord(organizationId, entityType, mapped);
          totalProcessed++;
          if (result === "created") totalCreated++;
          if (result === "updated") totalUpdated++;
        } catch (error) {
          console.error(`Failed to sync ${entityType} ${record.id}:`, error);
        }
      }
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        recordsProcessed: totalProcessed,
        recordsCreated: totalCreated,
        recordsUpdated: totalUpdated,
      },
    });

    await prisma.cRMIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "SUCCESS",
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
      },
    });
  }
}

/**
 * Push local changes to the CRM
 */
export async function pushToCRM(
  organizationId: string,
  entityType: EntityType,
  externalId: string,
  data: Record<string, unknown>
): Promise<void> {
  const integration = await getIntegration(organizationId);
  if (!integration || integration.status !== "CONNECTED") {
    throw new Error("No active integration");
  }

  const { accessToken, instanceUrl } = await getValidAccessToken(organizationId);
  const adapter = getProviderAdapter(integration.provider as CRMProvider);

  await adapter.updateRecord(
    entityType,
    accessToken,
    externalId,
    data,
    instanceUrl || undefined
  );

  // Log the push
  await prisma.syncLog.create({
    data: {
      integrationId: integration.id,
      entityType,
      operation: "push",
      direction: "outbound",
      status: "completed",
      recordsProcessed: 1,
      recordsUpdated: 1,
      completedAt: new Date(),
      metadata: JSON.stringify({ externalId, fields: Object.keys(data) }),
    },
  });
}

/**
 * Upsert a record in the local database
 */
async function upsertRecord(
  organizationId: string,
  entityType: EntityType,
  mapped: MappedLead | MappedContact | MappedCompany | MappedDeal
): Promise<"created" | "updated" | "skipped"> {
  switch (entityType) {
    case "lead":
      return upsertLead(organizationId, mapped as MappedLead);
    case "contact":
      return upsertContact(organizationId, mapped as MappedContact);
    case "company":
      return upsertCompany(organizationId, mapped as MappedCompany);
    case "deal":
      return upsertDeal(organizationId, mapped as MappedDeal);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

async function upsertLead(
  organizationId: string,
  data: MappedLead
): Promise<"created" | "updated" | "skipped"> {
  const existing = await prisma.lead.findFirst({
    where: {
      organizationId,
      externalId: data.externalId,
      externalSource: data.externalSource,
    },
  });

  if (existing) {
    await prisma.lead.update({
      where: { id: existing.id },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        company: data.company,
        jobTitle: data.jobTitle,
        source: data.source,
        status: data.status,
        externalUrl: data.externalUrl,
        lastSyncedAt: data.lastSyncedAt,
        syncStatus: "SYNCED",
      },
    });
    return "updated";
  }

  await prisma.lead.create({
    data: {
      organizationId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      company: data.company,
      jobTitle: data.jobTitle,
      source: data.source || "OTHER",
      status: data.status || "NEW",
      externalId: data.externalId,
      externalSource: data.externalSource,
      externalUrl: data.externalUrl,
      lastSyncedAt: data.lastSyncedAt,
      syncStatus: "SYNCED",
    },
  });
  return "created";
}

async function upsertContact(
  organizationId: string,
  data: MappedContact
): Promise<"created" | "updated" | "skipped"> {
  const existing = await prisma.contact.findFirst({
    where: {
      organizationId,
      externalId: data.externalId,
      externalSource: data.externalSource,
    },
  });

  // Try to find linked company by external ID
  let companyId: string | undefined;
  if (data.externalCompanyId) {
    const company = await prisma.company.findFirst({
      where: {
        organizationId,
        externalId: data.externalCompanyId,
      },
      select: { id: true },
    });
    companyId = company?.id;
  }

  if (existing) {
    await prisma.contact.update({
      where: { id: existing.id },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        jobTitle: data.jobTitle,
        department: data.department,
        linkedinUrl: data.linkedinUrl,
        companyId,
        externalUrl: data.externalUrl,
        lastSyncedAt: data.lastSyncedAt,
        syncStatus: "SYNCED",
      },
    });
    return "updated";
  }

  await prisma.contact.create({
    data: {
      organizationId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      jobTitle: data.jobTitle,
      department: data.department,
      linkedinUrl: data.linkedinUrl,
      companyId,
      externalId: data.externalId,
      externalSource: data.externalSource,
      externalUrl: data.externalUrl,
      lastSyncedAt: data.lastSyncedAt,
      syncStatus: "SYNCED",
    },
  });
  return "created";
}

async function upsertCompany(
  organizationId: string,
  data: MappedCompany
): Promise<"created" | "updated" | "skipped"> {
  const existing = await prisma.company.findFirst({
    where: {
      organizationId,
      externalId: data.externalId,
      externalSource: data.externalSource,
    },
  });

  if (existing) {
    await prisma.company.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        domain: data.domain,
        industry: data.industry,
        size: data.size,
        revenue: data.revenue,
        website: data.website,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        description: data.description,
        externalUrl: data.externalUrl,
        lastSyncedAt: data.lastSyncedAt,
        syncStatus: "SYNCED",
      },
    });
    return "updated";
  }

  await prisma.company.create({
    data: {
      organizationId,
      name: data.name,
      domain: data.domain,
      industry: data.industry,
      size: data.size,
      revenue: data.revenue,
      website: data.website,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      description: data.description,
      externalId: data.externalId,
      externalSource: data.externalSource,
      externalUrl: data.externalUrl,
      lastSyncedAt: data.lastSyncedAt,
      syncStatus: "SYNCED",
    },
  });
  return "created";
}

async function upsertDeal(
  organizationId: string,
  data: MappedDeal
): Promise<"created" | "updated" | "skipped"> {
  const existing = await prisma.deal.findFirst({
    where: {
      organizationId,
      externalId: data.externalId,
      externalSource: data.externalSource,
    },
  });

  // Try to find linked contact and company
  let contactId: string | undefined;
  let companyId: string | undefined;

  if (data.externalContactId) {
    const contact = await prisma.contact.findFirst({
      where: { organizationId, externalId: data.externalContactId },
      select: { id: true },
    });
    contactId = contact?.id;
  }

  if (data.externalCompanyId) {
    const company = await prisma.company.findFirst({
      where: { organizationId, externalId: data.externalCompanyId },
      select: { id: true },
    });
    companyId = company?.id;
  }

  // Get or create a default stage
  let stageId: string;
  const existingStage = await prisma.dealStage.findFirst({
    where: { organizationId },
    orderBy: { order: "asc" },
  });

  if (existingStage) {
    stageId = existingStage.id;
  } else {
    const newStage = await prisma.dealStage.create({
      data: {
        organizationId,
        name: data.stageName || "New",
        order: 0,
        probability: 10,
      },
    });
    stageId = newStage.id;
  }

  if (existing) {
    await prisma.deal.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        value: data.value || 0,
        currency: data.currency || "USD",
        status: data.status || "OPEN",
        probability: data.probability,
        expectedCloseDate: data.expectedCloseDate,
        actualCloseDate: data.actualCloseDate,
        notes: data.notes,
        contactId,
        companyId,
        externalUrl: data.externalUrl,
        lastSyncedAt: data.lastSyncedAt,
        syncStatus: "SYNCED",
      },
    });
    return "updated";
  }

  await prisma.deal.create({
    data: {
      organizationId,
      name: data.name,
      value: data.value || 0,
      currency: data.currency || "USD",
      stageId,
      status: data.status || "OPEN",
      probability: data.probability,
      expectedCloseDate: data.expectedCloseDate,
      actualCloseDate: data.actualCloseDate,
      notes: data.notes,
      contactId,
      companyId,
      externalId: data.externalId,
      externalSource: data.externalSource,
      externalUrl: data.externalUrl,
      lastSyncedAt: data.lastSyncedAt,
      syncStatus: "SYNCED",
    },
  });
  return "created";
}
