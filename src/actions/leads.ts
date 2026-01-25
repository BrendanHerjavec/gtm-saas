"use server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED";
export type LeadSource = "WEBSITE" | "REFERRAL" | "LINKEDIN" | "COLD_OUTREACH" | "EVENT" | "ADVERTISING" | "OTHER";

// NOTE: This app is a gifting marketplace, not a CRM.
// These functions provide analytics based on Recipients (not Leads).
// The Lead model doesn't exist in the schema.

export async function getLeads() {
  // Return empty data - this app uses Recipients, not Leads
  return {
    leads: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    integration: null,
  };
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
