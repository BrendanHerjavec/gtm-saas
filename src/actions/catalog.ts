"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export type GiftItemType = "all" | "PHYSICAL" | "DIGITAL" | "EXPERIENCE";

export interface GetCatalogParams {
  type?: GiftItemType;
  categoryId?: string;
  vendorId?: string;
  search?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
}

export async function getCatalog(params: GetCatalogParams = {}) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return { items: [], total: 0, page: 1, totalPages: 0 };
  }

  const { type = "all", categoryId, vendorId, search, inStock, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    organizationId: session.user.organizationId,
    isActive: true,
  };

  if (type !== "all") {
    where.type = type;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (vendorId) {
    where.vendorId = vendorId;
  }

  if (inStock !== undefined) {
    where.inStock = inStock;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.giftItem.findMany({
      where,
      include: {
        category: true,
        vendor: true,
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.giftItem.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getGiftItem(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return null;
  }

  return prisma.giftItem.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      category: true,
      vendor: true,
    },
  });
}

export interface CreateGiftItemInput {
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  currency?: string;
  categoryId?: string;
  vendorId?: string;
  sku?: string;
  type?: string;
  duration?: string;
  location?: string;
  tags?: string;
}

export async function createGiftItem(input: CreateGiftItemInput) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const item = await prisma.giftItem.create({
    data: {
      ...input,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/catalog");
  return item;
}

export async function updateGiftItem(id: string, input: Partial<CreateGiftItemInput> & { inStock?: boolean; isActive?: boolean }) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const item = await prisma.giftItem.update({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: input,
  });

  revalidatePath("/catalog");
  return item;
}

export async function deleteGiftItem(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.giftItem.delete({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/catalog");
}

// Categories
export async function getCategories() {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return [];
  }

  return prisma.giftCategory.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(input: { name: string; description?: string; icon?: string; color?: string }) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const category = await prisma.giftCategory.create({
    data: {
      ...input,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/catalog");
  return category;
}

// Vendors
export async function getVendors() {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return [];
  }

  return prisma.vendor.findMany({
    where: {
      organizationId: session.user.organizationId,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
}
