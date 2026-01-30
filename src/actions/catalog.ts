"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { demoGiftItems, demoGiftCategories } from "@/lib/demo-data";

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
  // Check for demo mode first
  if (await isDemoMode()) {
    const { type = "all", categoryId, search, inStock, page = 1, limit = 20 } = params;
    let filtered = demoGiftItems.map(item => ({
      ...item,
      duration: item.duration ?? null,
      location: item.location ?? null,
      category: item.categoryId ? demoGiftCategories.find(c => c.id === item.categoryId) || null : null,
      vendor: null,
    }));

    if (type !== "all") {
      filtered = filtered.filter(i => i.type === type);
    }
    if (categoryId) {
      filtered = filtered.filter(i => i.categoryId === categoryId);
    }
    if (inStock !== undefined) {
      filtered = filtered.filter(i => i.inStock === inStock);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(searchLower) ||
        i.description?.toLowerCase().includes(searchLower) ||
        i.tags?.toLowerCase().includes(searchLower)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return {
      items: paged,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

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
  // Handle demo mode
  if (await isDemoMode()) {
    const item = demoGiftItems.find(i => i.id === id);
    if (!item) return null;

    return {
      ...item,
      duration: item.duration ?? null,
      location: item.location ?? null,
      category: item.categoryId ? demoGiftCategories.find(c => c.id === item.categoryId) || null : null,
      vendor: null,
    };
  }

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
  // Handle demo mode - simulate creation without database
  if (await isDemoMode()) {
    const mockItem = {
      id: `demo-gift-${Date.now()}`,
      ...input,
      organizationId: "demo-org-id",
      inStock: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    revalidatePath("/catalog");
    return mockItem;
  }

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
  // Handle demo mode - simulate update without database
  if (await isDemoMode()) {
    const existingItem = demoGiftItems.find(i => i.id === id);
    if (!existingItem) {
      throw new Error("Gift item not found");
    }

    const mockUpdatedItem = {
      ...existingItem,
      ...input,
      updatedAt: new Date(),
    };

    revalidatePath("/catalog");
    return mockUpdatedItem;
  }

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
  // Handle demo mode - simulate delete without database
  if (await isDemoMode()) {
    revalidatePath("/catalog");
    return;
  }

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
  // Check for demo mode first
  if (await isDemoMode()) {
    return demoGiftCategories;
  }

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
  // Handle demo mode - simulate creation without database
  if (await isDemoMode()) {
    const mockCategory = {
      id: `demo-category-${Date.now()}`,
      ...input,
      organizationId: "demo-org-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    revalidatePath("/catalog");
    return mockCategory;
  }

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
  // Handle demo mode - return empty vendors list
  if (await isDemoMode()) {
    return [];
  }

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
