"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type DealStatus = "OPEN" | "WON" | "LOST";

export async function getDeals(params?: {
  stageId?: string;
  status?: DealStatus;
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
    ...(params?.stageId && { stageId: params.stageId }),
    ...(params?.status && { status: params.status }),
    ...(params?.search && {
      name: { contains: params.search, mode: "insensitive" as const },
    }),
  };

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        stage: true,
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.deal.count({ where }),
  ]);

  return {
    deals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDealsByStage() {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return [];
  }

  const stages = await prisma.dealStage.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { order: "asc" },
    include: {
      deals: {
        where: { status: "OPEN" },
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          contact: {
            select: { id: true, firstName: true, lastName: true },
          },
          company: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return stages;
}

export async function getDeal(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const deal = await prisma.deal.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      stage: true,
      contact: true,
      company: true,
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

  if (!deal) {
    throw new Error("Deal not found");
  }

  return deal;
}

export async function createDeal(data: {
  name: string;
  value: number;
  stageId: string;
  contactId?: string;
  companyId?: string;
  expectedCloseDate?: Date;
  notes?: string;
}) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const deal = await prisma.deal.create({
    data: {
      ...data,
      organizationId: session.user.organizationId,
      ownerId: session.user.id,
    },
  });

  revalidatePath("/deals");
  return deal;
}

export async function updateDeal(
  id: string,
  data: {
    name?: string;
    value?: number;
    stageId?: string;
    status?: DealStatus;
    contactId?: string;
    companyId?: string;
    expectedCloseDate?: Date;
    actualCloseDate?: Date;
    notes?: string;
    ownerId?: string;
  }
) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const deal = await prisma.deal.updateMany({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data,
  });

  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  return deal;
}

export async function updateDealStage(id: string, stageId: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.deal.updateMany({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: { stageId },
  });

  revalidatePath("/deals");
}

export async function deleteDeal(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.deal.deleteMany({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/deals");
}

export async function getDealStages() {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  return prisma.dealStage.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { order: "asc" },
  });
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

  const [totalDeals, openDeals, wonDeals, lostDeals, pipelineValue] = await Promise.all([
    prisma.deal.count({
      where: { organizationId: session.user.organizationId },
    }),
    prisma.deal.count({
      where: { organizationId: session.user.organizationId, status: "OPEN" },
    }),
    prisma.deal.count({
      where: { organizationId: session.user.organizationId, status: "WON" },
    }),
    prisma.deal.count({
      where: { organizationId: session.user.organizationId, status: "LOST" },
    }),
    prisma.deal.aggregate({
      where: { organizationId: session.user.organizationId, status: "OPEN" },
      _sum: { value: true },
    }),
  ]);

  const wonValue = await prisma.deal.aggregate({
    where: { organizationId: session.user.organizationId, status: "WON" },
    _sum: { value: true },
  });

  return {
    totalDeals,
    openDeals,
    wonDeals,
    lostDeals,
    pipelineValue: pipelineValue._sum.value || 0,
    wonValue: wonValue._sum.value || 0,
    winRate: totalDeals > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0,
  };
}
