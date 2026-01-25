"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export interface GetBudgetsParams {
  type?: string;
  active?: boolean;
}

export async function getBudgets(params: GetBudgetsParams = {}) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return [];
  }

  const { type, active } = params;
  const now = new Date();

  const where: any = {
    organizationId: session.user.organizationId,
  };

  if (type) {
    where.type = type;
  }

  if (active) {
    where.startDate = { lte: now };
    where.endDate = { gte: now };
  }

  return prisma.budget.findMany({
    where,
    orderBy: { startDate: "desc" },
  });
}

export async function getBudget(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return null;
  }

  return prisma.budget.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });
}

export async function getActiveBudget() {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return null;
  }

  const now = new Date();

  return prisma.budget.findFirst({
    where: {
      organizationId: session.user.organizationId,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { createdAt: "desc" },
  });
}

export interface CreateBudgetInput {
  name: string;
  type: string;
  amount: number;
  currency?: string;
  startDate: Date;
  endDate: Date;
  alertThreshold?: number;
}

export async function createBudget(input: CreateBudgetInput) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const budget = await prisma.budget.create({
    data: {
      ...input,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/budget");
  return budget;
}

export async function updateBudget(id: string, input: Partial<CreateBudgetInput>) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const budget = await prisma.budget.update({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: input,
  });

  revalidatePath("/budget");
  return budget;
}

export async function deleteBudget(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.budget.delete({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/budget");
}

export async function getBudgetSummary() {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return null;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [activeBudget, monthlySpend, totalSpend] = await Promise.all([
    prisma.budget.findFirst({
      where: {
        organizationId: session.user.organizationId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    }),
    prisma.send.aggregate({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { totalCost: true },
    }),
    prisma.send.aggregate({
      where: {
        organizationId: session.user.organizationId,
      },
      _sum: { totalCost: true },
    }),
  ]);

  return {
    activeBudget,
    monthlySpend: monthlySpend._sum.totalCost || 0,
    totalSpend: totalSpend._sum.totalCost || 0,
    remaining: activeBudget ? activeBudget.amount - activeBudget.spent : null,
    percentUsed: activeBudget ? (activeBudget.spent / activeBudget.amount) * 100 : null,
  };
}
