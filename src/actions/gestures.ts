"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";

export type GestureCategory =
  | "all"
  | "sustainability"
  | "food"
  | "gifting"
  | "wellness"
  | "experiences"
  | "personal";

export interface GetGesturesParams {
  category?: GestureCategory;
  search?: string;
  popularOnly?: boolean;
  page?: number;
  limit?: number;
}

const demoGestures = [
  { id: "g1", name: "Tree Planting", description: "Plant a tree in the recipient's name with a personalized certificate.", category: "sustainability", icon: "TreePine", minPrice: 15, maxPrice: 25, currency: "USD", popular: true, isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: "g2", name: "Local Coffee Delivery", description: "Send a coffee from a local cafe near the recipient.", category: "food", icon: "Coffee", minPrice: 20, maxPrice: 35, currency: "USD", popular: true, isActive: true, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: "g3", name: "Custom Swag Box", description: "Branded swag box with quality items they'll actually use.", category: "gifting", icon: "Gift", minPrice: 50, maxPrice: 150, currency: "USD", popular: false, isActive: true, sortOrder: 3, createdAt: new Date(), updatedAt: new Date() },
  { id: "g4", name: "Premium Gift Card", description: "Choose from 100+ brands for the perfect gift card.", category: "gifting", icon: "CreditCard", minPrice: 25, maxPrice: 250, currency: "USD", popular: false, isActive: true, sortOrder: 4, createdAt: new Date(), updatedAt: new Date() },
  { id: "g5", name: "Handwritten Note", description: "A genuine handwritten note on premium stationery.", category: "personal", icon: "PenTool", minPrice: 10, maxPrice: 25, currency: "USD", popular: true, isActive: true, sortOrder: 5, createdAt: new Date(), updatedAt: new Date() },
  { id: "g6", name: "Treats Box", description: "Curated box of gourmet treats and snacks.", category: "food", icon: "Cookie", minPrice: 40, maxPrice: 80, currency: "USD", popular: false, isActive: true, sortOrder: 6, createdAt: new Date(), updatedAt: new Date() },
  { id: "g7", name: "Charity Donation", description: "Make a donation to a charity of the recipient's choice.", category: "sustainability", icon: "Heart", minPrice: 25, maxPrice: 100, currency: "USD", popular: false, isActive: true, sortOrder: 7, createdAt: new Date(), updatedAt: new Date() },
  { id: "g8", name: "Wellness Credit", description: "Credit for wellness apps, classes, or services.", category: "wellness", icon: "Flower2", minPrice: 50, maxPrice: 150, currency: "USD", popular: false, isActive: true, sortOrder: 8, createdAt: new Date(), updatedAt: new Date() },
];

export async function getGestures(params: GetGesturesParams = {}) {
  if (await isDemoMode()) {
    const { category = "all", search, popularOnly = false, page = 1, limit = 50 } = params;
    let filtered = [...demoGestures];

    if (category !== "all") {
      filtered = filtered.filter((g) => g.category === category);
    }
    if (popularOnly) {
      filtered = filtered.filter((g) => g.popular);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((g) => g.name.toLowerCase().includes(s) || g.description.toLowerCase().includes(s));
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return { gestures: paged, total, page, totalPages: Math.ceil(total / limit) };
  }

  const {
    category = "all",
    search,
    popularOnly = false,
    page = 1,
    limit = 50,
  } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
  };

  if (category !== "all") {
    where.category = category;
  }

  if (popularOnly) {
    where.popular = true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [gestures, total] = await Promise.all([
    prisma.gesture.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.gesture.count({ where }),
  ]);

  return {
    gestures,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getGesture(id: string) {
  if (await isDemoMode()) {
    return demoGestures.find((g) => g.id === id) || null;
  }

  return prisma.gesture.findFirst({
    where: {
      id,
      isActive: true,
    },
  });
}

export async function getGestureCategories() {
  const categories = await prisma.gesture.groupBy({
    by: ["category"],
    where: { isActive: true },
    _count: { id: true },
  });

  return categories.map((c) => ({
    category: c.category,
    count: c._count.id,
  }));
}

// Admin actions (require auth)
export interface CreateGestureInput {
  name: string;
  description?: string;
  category: string;
  icon: string;
  minPrice: number;
  maxPrice: number;
  currency?: string;
  popular?: boolean;
  sortOrder?: number;
}

export async function createGesture(input: CreateGestureInput) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const gesture = await prisma.gesture.create({
    data: {
      ...input,
      currency: input.currency ?? "USD",
    },
  });

  revalidatePath("/marketplace");
  return gesture;
}

export async function updateGesture(
  id: string,
  input: Partial<CreateGestureInput> & { isActive?: boolean }
) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const gesture = await prisma.gesture.update({
    where: { id },
    data: input,
  });

  revalidatePath("/marketplace");
  return gesture;
}

export async function deleteGesture(id: string) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.gesture.delete({
    where: { id },
  });

  revalidatePath("/marketplace");
}

// Seed default gestures (one-time setup)
export async function seedDefaultGestures() {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const existingCount = await prisma.gesture.count();
  if (existingCount > 0) {
    return { message: "Gestures already seeded", count: existingCount };
  }

  const defaultGestures: CreateGestureInput[] = [
    // Sustainability
    {
      name: "Tree Planting",
      description:
        "Plant a tree in the recipient's name with a personalized certificate.",
      category: "sustainability",
      icon: "TreePine",
      minPrice: 15,
      maxPrice: 25,
      popular: true,
      sortOrder: 1,
    },
    {
      name: "Carbon Offset",
      description: "Offset carbon emissions on behalf of the recipient.",
      category: "sustainability",
      icon: "Leaf",
      minPrice: 20,
      maxPrice: 100,
      sortOrder: 2,
    },
    {
      name: "Charity Donation",
      description: "Make a donation to a charity of the recipient's choice.",
      category: "sustainability",
      icon: "Heart",
      minPrice: 25,
      maxPrice: 100,
      sortOrder: 3,
    },
    // Food & Beverage
    {
      name: "Local Coffee Delivery",
      description: "Send a coffee from a local cafe near the recipient.",
      category: "food",
      icon: "Coffee",
      minPrice: 20,
      maxPrice: 35,
      popular: true,
      sortOrder: 4,
    },
    {
      name: "Team Lunch",
      description: "Deliver lunch to the recipient's team for a celebration.",
      category: "food",
      icon: "Pizza",
      minPrice: 100,
      maxPrice: 250,
      sortOrder: 5,
    },
    {
      name: "Treats Box",
      description: "Curated box of gourmet treats and snacks.",
      category: "food",
      icon: "Cookie",
      minPrice: 40,
      maxPrice: 80,
      sortOrder: 6,
    },
    // Gifting
    {
      name: "Custom Swag Box",
      description: "Branded swag box with quality items they'll actually use.",
      category: "gifting",
      icon: "Gift",
      minPrice: 50,
      maxPrice: 150,
      sortOrder: 7,
    },
    {
      name: "Premium Gift Card",
      description: "Choose from 100+ brands for the perfect gift card.",
      category: "gifting",
      icon: "CreditCard",
      minPrice: 25,
      maxPrice: 250,
      sortOrder: 8,
    },
    {
      name: "Premium Gift",
      description: "High-end curated gifts for executive-level gestures.",
      category: "gifting",
      icon: "Sparkles",
      minPrice: 150,
      maxPrice: 500,
      sortOrder: 9,
    },
    // Wellness
    {
      name: "Wellness Credit",
      description: "Credit for wellness apps, classes, or services.",
      category: "wellness",
      icon: "Flower2",
      minPrice: 50,
      maxPrice: 150,
      sortOrder: 10,
    },
    {
      name: "Fitness Credit",
      description: "Credit for gym memberships or fitness classes.",
      category: "wellness",
      icon: "Dumbbell",
      minPrice: 75,
      maxPrice: 200,
      sortOrder: 11,
    },
    // Experiences
    {
      name: "Custom Art Piece",
      description: "Commission a custom art piece for the recipient.",
      category: "experiences",
      icon: "Palette",
      minPrice: 100,
      maxPrice: 500,
      sortOrder: 12,
    },
    // Personal Touch
    {
      name: "Curated Book",
      description: "A thoughtfully selected book based on their interests.",
      category: "personal",
      icon: "BookOpen",
      minPrice: 20,
      maxPrice: 40,
      sortOrder: 13,
    },
    {
      name: "Handwritten Note",
      description: "A genuine handwritten note on premium stationery.",
      category: "personal",
      icon: "PenTool",
      minPrice: 10,
      maxPrice: 25,
      popular: true,
      sortOrder: 14,
    },
  ];

  await prisma.gesture.createMany({
    data: defaultGestures.map((g) => ({
      ...g,
      currency: "USD",
    })),
  });

  revalidatePath("/marketplace");
  return { message: "Gestures seeded successfully", count: defaultGestures.length };
}
