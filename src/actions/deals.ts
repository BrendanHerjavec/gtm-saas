"use server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type DealStatus = "OPEN" | "WON" | "LOST";

// NOTE: This app is a gifting marketplace, not a CRM.
// Deal and DealStage models don't exist in the schema.
// These functions return empty/default data based on Sends.

export async function getDeals() {
  // Return empty data - this app doesn't have a Deal model
  return {
    deals: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}

export async function getDealsByStage() {
  // Return empty stages - DealStage model doesn't exist
  return [];
}

export async function getDeal(id: string) {
  // Deal model doesn't exist
  throw new Error("Deal not found");
}

export async function getDealStats() {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return {
      totalDeals: 0,
      openDeals: 0,
      wonDeals: 0,
      lostDeals: 0,
      pipelineValue: 0,
      wonValue: 0,
      winRate: 0,
    };
  }

  // Use Sends to provide deal-like stats since Deal model doesn't exist
  try {
    const [totalSends, deliveredSends, pendingSends] = await Promise.all([
      prisma.send.count({
        where: { organizationId: session.user.organizationId },
      }),
      prisma.send.count({
        where: { organizationId: session.user.organizationId, status: "DELIVERED" },
      }),
      prisma.send.count({
        where: { organizationId: session.user.organizationId, status: "PENDING" },
      }),
    ]);

    const totalValue = await prisma.send.aggregate({
      where: { organizationId: session.user.organizationId },
      _sum: { totalCost: true },
    });

    const deliveredValue = await prisma.send.aggregate({
      where: { organizationId: session.user.organizationId, status: "DELIVERED" },
      _sum: { totalCost: true },
    });

    return {
      totalDeals: totalSends,
      openDeals: pendingSends,
      wonDeals: deliveredSends,
      lostDeals: 0,
      pipelineValue: totalValue._sum.totalCost || 0,
      wonValue: deliveredValue._sum.totalCost || 0,
      winRate: totalSends > 0 ? (deliveredSends / totalSends) * 100 : 0,
    };
  } catch {
    return {
      totalDeals: 0,
      openDeals: 0,
      wonDeals: 0,
      lostDeals: 0,
      pipelineValue: 0,
      wonValue: 0,
      winRate: 0,
    };
  }
}

export async function getDealStages() {
  // DealStage model doesn't exist
  return [];
}
