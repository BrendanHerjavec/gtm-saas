"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { demoSends, demoRecipients, demoGiftItems, demoCampaigns, DEMO_USER_ID } from "@/lib/demo-data";

export type SendStatus = "all" | "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "FAILED" | "CANCELLED";
export type SendType = "all" | "GIFT" | "HANDWRITTEN_NOTE" | "VIDEO" | "EXPERIENCE" | "DIRECT_MAIL";

export interface GetSendsParams {
  status?: SendStatus;
  type?: SendType;
  recipientId?: string;
  campaignId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getSends(params: GetSendsParams = {}) {
  // Check for demo mode first
  if (await isDemoMode()) {
    const { status = "all", type = "all", recipientId, campaignId, page = 1, limit = 20 } = params;
    let filtered = demoSends.map(send => ({
      ...send,
      recipient: demoRecipients.find(r => r.id === send.recipientId) || null,
      giftItem: send.giftItemId ? demoGiftItems.find(g => g.id === send.giftItemId) || null : null,
      campaign: send.campaignId ? demoCampaigns.find(c => c.id === send.campaignId) || null : null,
      user: { id: DEMO_USER_ID, name: "Demo User", email: "demo@example.com" },
    }));

    if (status !== "all") {
      filtered = filtered.filter(s => s.status === status);
    }
    if (type !== "all") {
      filtered = filtered.filter(s => s.type === type);
    }
    if (recipientId) {
      filtered = filtered.filter(s => s.recipientId === recipientId);
    }
    if (campaignId) {
      filtered = filtered.filter(s => s.campaignId === campaignId);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return {
      sends: paged,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return { sends: [], total: 0, page: 1, totalPages: 0 };
  }

  const { status = "all", type = "all", recipientId, campaignId, search, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    organizationId: session.user.organizationId,
  };

  if (status !== "all") {
    where.status = status;
  }

  if (type !== "all") {
    where.type = type;
  }

  if (recipientId) {
    where.recipientId = recipientId;
  }

  if (campaignId) {
    where.campaignId = campaignId;
  }

  const [sends, total] = await Promise.all([
    prisma.send.findMany({
      where,
      include: {
        recipient: true,
        giftItem: true,
        campaign: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.send.count({ where }),
  ]);

  return {
    sends,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSend(id: string) {
  // Handle demo mode
  if (await isDemoMode()) {
    const send = demoSends.find(s => s.id === id);
    if (!send) return null;

    return {
      ...send,
      recipient: demoRecipients.find(r => r.id === send.recipientId) || null,
      giftItem: send.giftItemId ? demoGiftItems.find(g => g.id === send.giftItemId) || null : null,
      campaign: send.campaignId ? demoCampaigns.find(c => c.id === send.campaignId) || null : null,
      vendor: null,
      user: { id: DEMO_USER_ID, name: "Demo User", email: "demo@example.com" },
      activities: [],
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return null;
  }

  return prisma.send.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      recipient: true,
      giftItem: true,
      campaign: true,
      vendor: true,
      user: {
        select: { id: true, name: true, email: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export interface CreateSendInput {
  recipientId: string;
  giftItemId?: string;
  campaignId?: string;
  vendorId?: string;
  type: string;
  message?: string;
  videoUrl?: string;
  shippingAddress?: string;
  scheduledAt?: Date;
  notes?: string;
}

export async function createSend(input: CreateSendInput) {
  // Handle demo mode - simulate creation without database
  if (await isDemoMode()) {
    const giftItem = input.giftItemId
      ? demoGiftItems.find(g => g.id === input.giftItemId)
      : null;
    const recipient = demoRecipients.find(r => r.id === input.recipientId);
    const itemCost = giftItem?.price || 0;

    const mockSend = {
      id: `demo-send-${Date.now()}`,
      ...input,
      organizationId: "demo-org-id",
      userId: DEMO_USER_ID,
      status: "PENDING",
      itemCost,
      shippingCost: 0,
      totalCost: itemCost,
      triggerType: "manual",
      createdAt: new Date(),
      updatedAt: new Date(),
      recipient,
      giftItem,
    };

    revalidatePath("/sends");
    return mockSend;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get gift item price if provided
  let itemCost = 0;
  if (input.giftItemId) {
    const giftItem = await prisma.giftItem.findUnique({
      where: { id: input.giftItemId },
    });
    if (giftItem) {
      itemCost = giftItem.price;
    }
  }

  const send = await prisma.send.create({
    data: {
      ...input,
      organizationId: session.user.organizationId,
      userId: session.user.id,
      itemCost,
      totalCost: itemCost,
      triggerType: "manual",
    },
    include: {
      recipient: true,
      giftItem: true,
    },
  });

  revalidatePath("/sends");
  return send;
}

export async function updateSend(id: string, input: Partial<CreateSendInput> & { status?: string }) {
  // Handle demo mode - simulate update without database
  if (await isDemoMode()) {
    const existingSend = demoSends.find(s => s.id === id);
    if (!existingSend) {
      throw new Error("Send not found");
    }

    const mockUpdatedSend = {
      ...existingSend,
      ...input,
      updatedAt: new Date(),
    };

    revalidatePath("/sends");
    revalidatePath(`/sends/${id}`);
    return mockUpdatedSend;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const send = await prisma.send.update({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: input,
  });

  revalidatePath("/sends");
  revalidatePath(`/sends/${id}`);
  return send;
}

export async function cancelSend(id: string) {
  // Handle demo mode - simulate cancel without database
  if (await isDemoMode()) {
    const existingSend = demoSends.find(s => s.id === id);
    if (!existingSend) {
      throw new Error("Send not found");
    }

    const mockCancelledSend = {
      ...existingSend,
      status: "CANCELLED",
      updatedAt: new Date(),
    };

    revalidatePath("/sends");
    return mockCancelledSend;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const send = await prisma.send.update({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: {
      status: "CANCELLED",
    },
  });

  revalidatePath("/sends");
  return send;
}

export async function getSendStats() {
  // Check for demo mode first
  if (await isDemoMode()) {
    const total = demoSends.length;
    const pending = demoSends.filter(s => s.status === "PENDING").length;
    const processing = demoSends.filter(s => s.status === "PROCESSING").length;
    const shipped = demoSends.filter(s => s.status === "SHIPPED").length;
    const delivered = demoSends.filter(s => s.status === "DELIVERED").length;
    const failed = demoSends.filter(s => s.status === "FAILED").length;
    const totalSpent = demoSends.reduce((sum, s) => sum + s.totalCost, 0);

    return {
      total,
      pending: pending + processing,
      shipped,
      delivered,
      failed,
      totalSpent,
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return null;
  }

  const [total, pending, shipped, delivered, failed, totalSpent] = await Promise.all([
    prisma.send.count({
      where: { organizationId: session.user.organizationId },
    }),
    prisma.send.count({
      where: { organizationId: session.user.organizationId, status: "PENDING" },
    }),
    prisma.send.count({
      where: { organizationId: session.user.organizationId, status: "SHIPPED" },
    }),
    prisma.send.count({
      where: { organizationId: session.user.organizationId, status: "DELIVERED" },
    }),
    prisma.send.count({
      where: { organizationId: session.user.organizationId, status: "FAILED" },
    }),
    prisma.send.aggregate({
      where: { organizationId: session.user.organizationId },
      _sum: { totalCost: true },
    }),
  ]);

  return {
    total,
    pending,
    shipped,
    delivered,
    failed,
    totalSpent: totalSpent._sum.totalCost || 0,
  };
}
