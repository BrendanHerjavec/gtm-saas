"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { demoBudgets, demoSends } from "@/lib/demo-data";
import { z, ZodError } from "zod";

export interface GetBudgetsParams {
  type?: string;
  active?: boolean;
}

export async function getBudgets(params: GetBudgetsParams = {}) {
  // Check for demo mode first
  if (await isDemoMode()) {
    const { type, active } = params;
    const now = new Date();
    let filtered = [...demoBudgets];

    if (type) {
      filtered = filtered.filter(b => b.type === type);
    }
    if (active) {
      filtered = filtered.filter(b => b.startDate <= now && b.endDate >= now);
    }

    return filtered;
  }

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
  // Handle demo mode
  if (await isDemoMode()) {
    return demoBudgets.find(b => b.id === id) || null;
  }

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
  // Check for demo mode first
  if (await isDemoMode()) {
    const now = new Date();
    return demoBudgets.find(b => b.startDate <= now && b.endDate >= now) || null;
  }

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

const createBudgetInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.string().min(1, "Type is required"),
  amount: z.number().min(0, "Amount must be positive"),
  currency: z.string().length(3).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  alertThreshold: z.number().min(0).max(100).optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: "End date must be after start date", path: ["endDate"] }
);

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
  // Validate input
  const result = createBudgetInputSchema.safeParse(input);
  if (!result.success) {
    const errors = result.error.errors.map(e => e.message).join(', ');
    throw new Error(`Validation failed: ${errors}`);
  }

  // Handle demo mode - simulate creation without database
  if (await isDemoMode()) {
    const mockBudget = {
      id: `demo-budget-${Date.now()}`,
      ...input,
      spent: 0,
      currency: input.currency || "USD",
      alertSent: false,
      organizationId: "demo-org-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    revalidatePath("/budget");
    return mockBudget;
  }

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
  // Handle demo mode - simulate update without database
  if (await isDemoMode()) {
    const existingBudget = demoBudgets.find(b => b.id === id);
    if (!existingBudget) {
      throw new Error("Budget not found");
    }

    const mockUpdatedBudget = {
      ...existingBudget,
      ...input,
      updatedAt: new Date(),
    };

    revalidatePath("/budget");
    return mockUpdatedBudget;
  }

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
  // Handle demo mode - simulate delete without database
  if (await isDemoMode()) {
    revalidatePath("/budget");
    return;
  }

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
  // Check for demo mode first
  if (await isDemoMode()) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeBudget = demoBudgets.find(b => b.startDate <= now && b.endDate >= now);
    const monthlySpend = demoSends
      .filter(s => s.createdAt >= startOfMonth)
      .reduce((sum, s) => sum + s.totalCost, 0);
    const totalSpend = demoSends.reduce((sum, s) => sum + s.totalCost, 0);

    return {
      activeBudget,
      monthlySpend,
      totalSpend,
      remaining: activeBudget ? activeBudget.amount - activeBudget.spent : null,
      percentUsed: activeBudget ? (activeBudget.spent / activeBudget.amount) * 100 : null,
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return {
      activeBudget: null,
      monthlySpend: 0,
      totalSpend: 0,
      remaining: null,
      percentUsed: null,
    };
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
