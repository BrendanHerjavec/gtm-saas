"use server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED";
export type LeadSource = "WEBSITE" | "REFERRAL" | "LINKEDIN" | "COLD_OUTREACH" | "EVENT" | "ADVERTISING" | "OTHER";

// NOTE: This app is a gifting marketplace, not a CRM.
// These functions provide analytics based on Recipients (not Leads).
// The Lead model doesn't exist in the schema.

export async function createLead(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  status?: string;
  notes?: string;
}) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Create as a recipient since this app uses Recipients
  const recipient = await prisma.recipient.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      company: data.company,
      jobTitle: data.jobTitle,
      notes: data.notes,
      organizationId: session.user.organizationId,
    },
  });

  return recipient;
}

export async function updateLead(id: string, data: {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  status?: string;
  notes?: string;
}) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const recipient = await prisma.recipient.update({
    where: { id },
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      company: data.company,
      jobTitle: data.jobTitle,
      notes: data.notes,
    },
  });

  return recipient;
}

export async function getLeads() {
  // Return empty data - this app uses Recipients, not Leads
  return {
    leads: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    integration: null,
  };
}

export async function deleteLead(id: string) {
  // Leads map to Recipients in this app
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.recipient.deleteMany({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });
}

export async function convertLeadToContact(id: string) {
  // In this app, leads are already recipients - this is a no-op
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Verify the recipient exists
  const recipient = await prisma.recipient.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  if (!recipient) {
    throw new Error("Lead not found");
  }

  return recipient;
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

  // Use Recipients for analytics since Lead model doesn't exist
  try {
    const total = await prisma.recipient.count({
      where: { organizationId: session.user.organizationId },
    });

    const recentRecipients = await prisma.recipient.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
        createdAt: true,
      },
    });

    return {
      total,
      byStatus: { NEW: total } as Record<LeadStatus, number>,
      bySource: {} as Record<LeadSource, number>,
      recentLeads: recentRecipients.map((r) => ({
        ...r,
        status: "NEW" as const,
      })),
    };
  } catch {
    return {
      total: 0,
      byStatus: {} as Record<LeadStatus, number>,
      bySource: {} as Record<LeadSource, number>,
      recentLeads: [],
    };
  }
}
