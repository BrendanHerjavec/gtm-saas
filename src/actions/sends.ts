"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

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
