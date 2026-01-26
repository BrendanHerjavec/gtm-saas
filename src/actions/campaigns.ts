"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/demo-mode";
import { demoCampaigns, demoSends, DEMO_USER_ID } from "@/lib/demo-data";

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "RUNNING" | "PAUSED" | "COMPLETED";
export type CampaignType = "EMAIL" | "SEQUENCE" | "SMS";

export async function getCampaigns(params?: {
  status?: CampaignStatus;
  type?: CampaignType;
  search?: string;
  page?: number;
  limit?: number;
}) {
  // Check for demo mode first
  if (await isDemoMode()) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;

    let filtered = demoCampaigns.map(campaign => {
      const campaignSends = demoSends.filter(s => s.campaignId === campaign.id);
      return {
        ...campaign,
        createdBy: { id: DEMO_USER_ID, name: "Demo User", email: "demo@example.com", image: null },
        stats: {
          id: `stats-${campaign.id}`,
          campaignId: campaign.id,
          totalSends: campaignSends.length,
          pending: campaignSends.filter(s => s.status === "PENDING" || s.status === "PROCESSING").length,
          processing: 0,
          shipped: campaignSends.filter(s => s.status === "SHIPPED").length,
          delivered: campaignSends.filter(s => s.status === "DELIVERED").length,
          failed: campaignSends.filter(s => s.status === "FAILED").length,
          totalSpent: campaignSends.reduce((sum, s) => sum + s.totalCost, 0),
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        },
      };
    });

    if (params?.status) {
      filtered = filtered.filter(c => c.status === params.status);
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchLower));
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return {
      campaigns: paged,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return { campaigns: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where = {
    organizationId: session.user.organizationId,
    ...(params?.status && { status: params.status }),
    ...(params?.type && { type: params.type }),
    ...(params?.search && {
      name: { contains: params.search, mode: "insensitive" as const },
    }),
  };

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        stats: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return {
    campaigns,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCampaign(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, image: true },
      },
      stats: true,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return campaign;
}

export async function createCampaign(data: {
  name: string;
  subject?: string;
  content?: string;
  type?: CampaignType;
  scheduledAt?: Date;
}) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const campaign = await prisma.campaign.create({
    data: {
      ...data,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
  });

  // Create initial stats
  await prisma.campaignStats.create({
    data: {
      campaignId: campaign.id,
    },
  });

  revalidatePath("/campaigns");
  return campaign;
}

export async function updateCampaign(
  id: string,
  data: {
    name?: string;
    subject?: string;
    content?: string;
    status?: CampaignStatus;
    type?: CampaignType;
    scheduledAt?: Date;
  }
) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const campaign = await prisma.campaign.updateMany({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data,
  });

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  return campaign;
}

export async function deleteCampaign(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.campaign.deleteMany({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/campaigns");
}

export async function getCampaignStats() {
  // Check for demo mode first
  if (await isDemoMode()) {
    const total = demoCampaigns.length;
    const byStatus: Record<string, number> = {};
    demoCampaigns.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    });

    const sent = demoSends.length;
    const delivered = demoSends.filter(s => s.status === "DELIVERED").length;
    const shipped = demoSends.filter(s => s.status === "SHIPPED").length;

    return {
      total,
      byStatus,
      metrics: {
        sent,
        delivered,
        opened: shipped + delivered,
        clicked: 0,
        deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
        openRate: sent > 0 ? ((shipped + delivered) / sent) * 100 : 0,
        clickRate: 0,
      },
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return {
      total: 0,
      byStatus: {} as Record<string, number>,
      metrics: { sent: 0, delivered: 0, opened: 0, clicked: 0, deliveryRate: 0, openRate: 0, clickRate: 0 },
    };
  }

  try {
    const [total, byStatus, aggregateStats] = await Promise.all([
      prisma.campaign.count({
        where: { organizationId: session.user.organizationId },
      }),
      prisma.campaign.groupBy({
        by: ["status"],
        where: { organizationId: session.user.organizationId },
        _count: { status: true },
      }),
      prisma.campaignStats.aggregate({
        where: {
          campaign: { organizationId: session.user.organizationId },
        },
        _sum: {
          totalSends: true,
          delivered: true,
          shipped: true,
          pending: true,
          failed: true,
        },
      }),
    ]);

    const sent = aggregateStats._sum.totalSends || 0;
    const delivered = aggregateStats._sum.delivered || 0;
    const shipped = aggregateStats._sum.shipped || 0;

    return {
      total,
      byStatus: byStatus.reduce(
        (acc: Record<string, number>, item: { status: string; _count: { status: number } }) => {
          acc[item.status] = item._count.status;
          return acc;
        },
        {} as Record<string, number>
      ),
      metrics: {
        sent,
        delivered,
        opened: shipped, // Use shipped as a proxy for "opened/received"
        clicked: 0, // Not tracked in this schema
        deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
        openRate: sent > 0 ? (shipped / sent) * 100 : 0,
        clickRate: 0,
      },
    };
  } catch {
    return {
      total: 0,
      byStatus: {} as Record<string, number>,
      metrics: { sent: 0, delivered: 0, opened: 0, clicked: 0, deliveryRate: 0, openRate: 0, clickRate: 0 },
    };
  }
}
