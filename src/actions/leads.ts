"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveIntegration, getIntegration } from "@/lib/integrations/oauth";
import { pushToCRM } from "@/lib/integrations/sync";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED";
export type LeadSource = "WEBSITE" | "REFERRAL" | "LINKEDIN" | "COLD_OUTREACH" | "EVENT" | "ADVERTISING" | "OTHER";

// Fields that can be pushed back to the CRM
const CRM_SYNCABLE_FIELDS = ["email", "firstName", "lastName", "phone", "company", "jobTitle", "status"];

export async function getLeads(params?: {
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where = {
    organizationId: session.user.organizationId,
    ...(params?.status && { status: params.status }),
    ...(params?.source && { source: params.source }),
    ...(params?.search && {
      OR: [
        { email: { contains: params.search } },
        { firstName: { contains: params.search } },
        { lastName: { contains: params.search } },
        { company: { contains: params.search } },
      ],
    }),
  };

  // Check for CRM integration
  const integration = await getIntegration(session.user.organizationId);

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    // Include integration context for UI
    integration: integration
      ? {
          provider: integration.provider,
          status: integration.status,
          lastSyncAt: integration.lastSyncAt,
        }
      : null,
  };
}

export async function getLead(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      activities: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  return lead;
}

export async function createLead(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: LeadSource;
  notes?: string;
}) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Check if CRM is connected - if so, restrict local creation
  const isIntegrated = await hasActiveIntegration(session.user.organizationId);
  if (isIntegrated) {
    throw new Error(
      "Cannot create leads directly when CRM is connected. " +
      "Please create leads in your CRM and they will sync automatically."
    );
  }

  const lead = await prisma.lead.create({
    data: {
      ...data,
      organizationId: session.user.organizationId,
      ownerId: session.user.id,
    },
  });

  revalidatePath("/leads");
  return lead;
}

export async function updateLead(
  id: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    source?: LeadSource;
    status?: LeadStatus;
    score?: number;
    notes?: string;
    ownerId?: string;
  }
) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Get the lead to check if it's from a CRM
  const existingLead = await prisma.lead.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  if (!existingLead) {
    throw new Error("Lead not found");
  }

  // Separate CRM-syncable fields from local-only fields
  const crmSyncableData: Record<string, unknown> = {};
  const localOnlyData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (CRM_SYNCABLE_FIELDS.includes(key)) {
        crmSyncableData[key] = value;
      } else {
        localOnlyData[key] = value;
      }
    }
  }

  // Update local record
  const lead = await prisma.lead.updateMany({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: {
      ...data,
      // Mark as pending sync if CRM fields changed and record is from CRM
      ...(existingLead.externalId && Object.keys(crmSyncableData).length > 0
        ? { syncStatus: "PENDING" }
        : {}),
    },
  });

  // Push to CRM if connected and record has external ID
  if (existingLead.externalId && Object.keys(crmSyncableData).length > 0) {
    // Async push - don't block the response
    pushToCRM(session.user.organizationId, "lead", existingLead.externalId, crmSyncableData)
      .then(async () => {
        await prisma.lead.update({
          where: { id },
          data: { syncStatus: "SYNCED", lastSyncedAt: new Date() },
        });
      })
      .catch(async (error) => {
        console.error("Failed to push lead to CRM:", error);
        await prisma.lead.update({
          where: { id },
          data: { syncStatus: "ERROR" },
        });
      });
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return lead;
}

export async function deleteLead(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Check if this lead is from a CRM
  const lead = await prisma.lead.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    select: { externalId: true },
  });

  if (lead?.externalId) {
    throw new Error(
      "Cannot delete CRM-synced leads. Please delete this lead in your CRM."
    );
  }

  // Only delete local-only leads
  await prisma.lead.deleteMany({
    where: {
      id,
      organizationId: session.user.organizationId,
      externalId: null, // Safety check
    },
  });

  revalidatePath("/leads");
}

export async function convertLeadToContact(leadId: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      organizationId: session.user.organizationId,
    },
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  const contact = await prisma.contact.create({
    data: {
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      jobTitle: lead.jobTitle,
      organizationId: session.user.organizationId,
      ownerId: lead.ownerId,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "CONVERTED",
      convertedAt: new Date(),
      contactId: contact.id,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/contacts");
  return contact;
}

export async function getLeadStats() {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return {
      total: 0,
      byStatus: {} as Record<LeadStatus, number>,
      bySource: {} as Record<LeadSource, number>,
      recentLeads: [],
    };
  }

  const [total, byStatus, bySource, recentLeads] = await Promise.all([
    prisma.lead.count({
      where: { organizationId: session.user.organizationId },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { organizationId: session.user.organizationId },
      _count: { status: true },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { organizationId: session.user.organizationId },
      _count: { source: true },
    }),
    prisma.lead.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    total,
    byStatus: byStatus.reduce(
      (acc: Record<LeadStatus, number>, item: { status: string; _count: { status: number } }) => {
        acc[item.status as LeadStatus] = item._count.status;
        return acc;
      },
      {} as Record<LeadStatus, number>
    ),
    bySource: bySource.reduce(
      (acc: Record<LeadSource, number>, item: { source: string; _count: { source: number } }) => {
        acc[item.source as LeadSource] = item._count.source;
        return acc;
      },
      {} as Record<LeadSource, number>
    ),
    recentLeads,
  };
}
