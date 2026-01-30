"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { demoTaskDecks, DEMO_USER_ID, DEMO_ORG_ID } from "@/lib/demo-data";

export type DeckStatus = "all" | "SEALED" | "OPENING" | "OPENED" | "COMPLETED";

export interface TaskDeck {
  id: string;
  name: string;
  description: string | null;
  coverColor: string | null;
  emoji: string | null;
  status: string;
  openedAt: Date | null;
  completedAt: Date | null;
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  sourceType: string | null;
  sourceId: string | null;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDeckWithCreator extends TaskDeck {
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
  _count?: {
    tasks: number;
  };
}

export interface GetTaskDecksParams {
  status?: DeckStatus;
  page?: number;
  limit?: number;
}

/**
 * Get all task decks for the organization
 */
export async function getTaskDecks(params: GetTaskDecksParams = {}) {
  const { status = "all", page = 1, limit = 20 } = params;

  // Check for demo mode first
  if (await isDemoMode()) {
    let filtered = demoTaskDecks.map((deck) => ({
      ...deck,
      createdBy: { id: DEMO_USER_ID, name: "Demo User", email: "demo@example.com" },
      _count: { tasks: deck.totalTasks },
    }));

    if (status !== "all") {
      filtered = filtered.filter((d) => d.status === status);
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return {
      decks: paged as TaskDeckWithCreator[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return { decks: [], total: 0, page: 1, totalPages: 0 };
  }

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    organizationId: session.user.organizationId,
  };

  if (status !== "all") {
    where.status = status;
  }

  const [decks, total] = await Promise.all([
    prisma.taskDeck.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.taskDeck.count({ where }),
  ]);

  return {
    decks: decks as TaskDeckWithCreator[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get a single task deck by ID
 */
export async function getTaskDeck(id: string) {
  // Check for demo mode first
  if (await isDemoMode()) {
    const deck = demoTaskDecks.find((d) => d.id === id);

    // Import demo tasks and recipients for demo mode
    const { demoOutreachTasks, demoRecipients } = await import("@/lib/demo-data");

    // For known demo decks, get their tasks
    if (deck) {
      const deckTasks = demoOutreachTasks
        .filter((t) => t.deckId === id)
        .map((task) => ({
          ...task,
          recipient: demoRecipients.find((r) => r.id === task.recipientId) || demoRecipients[0],
          assignedTo: task.assignedToId
            ? { id: DEMO_USER_ID, name: "Demo User", email: "demo@example.com" }
            : null,
        }));

      return {
        ...deck,
        createdBy: { id: DEMO_USER_ID, name: "Demo User", email: "demo@example.com" },
        tasks: deckTasks,
      };
    }

    // For newly created demo decks, return a shell with no tasks
    if (id.startsWith("demo-deck-")) {
      return {
        id,
        name: "New Deck",
        description: null,
        coverColor: "#3B82F6",
        emoji: "📦",
        status: "SEALED",
        openedAt: null,
        completedAt: null,
        totalTasks: 0,
        completedTasks: 0,
        skippedTasks: 0,
        sourceType: "manual",
        sourceId: null,
        organizationId: DEMO_ORG_ID,
        createdById: DEMO_USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: { id: DEMO_USER_ID, name: "Demo User", email: "demo@example.com" },
        tasks: [],
      };
    }

    return null;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return null;
  }

  return prisma.taskDeck.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      tasks: {
        include: {
          recipient: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              company: true,
              jobTitle: true,
              linkedinUrl: true,
              address: true,
              notes: true,
              tags: true,
            },
          },
        },
        orderBy: [{ priority: "desc" }, { sortOrder: "asc" }],
      },
    },
  });
}

export interface CreateTaskDeckInput {
  name: string;
  description?: string;
  coverColor?: string;
  emoji?: string;
  taskIds?: string[];
}

/**
 * Create a new task deck
 */
export async function createTaskDeck(input: CreateTaskDeckInput) {
  // Demo mode: return mock deck
  if (await isDemoMode()) {
    const mockDeck = {
      id: `demo-deck-${Date.now()}`,
      name: input.name,
      description: input.description || null,
      coverColor: input.coverColor || "#3B82F6",
      emoji: input.emoji || "📦",
      status: "SEALED",
      openedAt: null,
      completedAt: null,
      totalTasks: input.taskIds?.length || 0,
      completedTasks: 0,
      skippedTasks: 0,
      sourceType: "manual",
      sourceId: null,
      organizationId: DEMO_ORG_ID,
      createdById: DEMO_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    revalidatePath("/tasks");
    return mockDeck;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const deck = await prisma.taskDeck.create({
    data: {
      name: input.name,
      description: input.description,
      coverColor: input.coverColor,
      emoji: input.emoji,
      status: "SEALED",
      totalTasks: input.taskIds?.length || 0,
      sourceType: "manual",
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
  });

  // If taskIds provided, assign those tasks to this deck
  if (input.taskIds && input.taskIds.length > 0) {
    await prisma.outreachTask.updateMany({
      where: {
        id: { in: input.taskIds },
        organizationId: session.user.organizationId,
      },
      data: {
        deckId: deck.id,
      },
    });
  }

  revalidatePath("/tasks");
  return deck;
}

export interface UpdateTaskDeckInput {
  name?: string;
  description?: string;
  coverColor?: string;
  emoji?: string;
  status?: string;
}

/**
 * Update a task deck
 */
export async function updateTaskDeck(id: string, input: UpdateTaskDeckInput) {
  // Demo mode: return mock updated deck
  if (await isDemoMode()) {
    const deck = demoTaskDecks.find((d) => d.id === id);
    if (!deck) throw new Error("Deck not found");
    const updated = {
      ...deck,
      ...input,
      ...(input.status === "OPENED" && { openedAt: new Date() }),
      ...(input.status === "COMPLETED" && { completedAt: new Date() }),
      updatedAt: new Date(),
    };
    revalidatePath("/tasks");
    revalidatePath(`/tasks/decks/${id}`);
    return updated;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const updateData: Record<string, unknown> = { ...input };

  // If status is changing to OPENED, set openedAt
  if (input.status === "OPENED") {
    updateData.openedAt = new Date();
  }

  // If status is changing to COMPLETED, set completedAt
  if (input.status === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  const deck = await prisma.taskDeck.update({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: updateData,
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/decks/${id}`);
  return deck;
}

/**
 * Open a sealed deck (triggers animation state)
 */
export async function openTaskDeck(id: string) {
  // Demo mode: return mock opened deck without DB call
  if (await isDemoMode()) {
    const deck = demoTaskDecks.find((d) => d.id === id);
    if (!deck) throw new Error("Deck not found");
    revalidatePath("/tasks");
    revalidatePath(`/tasks/decks/${id}`);
    return { ...deck, status: "OPENED", openedAt: new Date() };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // First set to OPENING state (for animation)
  await prisma.taskDeck.update({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: {
      status: "OPENING",
    },
  });

  // Then set to OPENED with timestamp
  const deck = await prisma.taskDeck.update({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: {
      status: "OPENED",
      openedAt: new Date(),
    },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/decks/${id}`);
  return deck;
}

/**
 * Add tasks to a deck
 */
export async function addTasksToDeck(deckId: string, taskIds: string[]) {
  // Demo mode: return mock success
  if (await isDemoMode()) {
    revalidatePath("/tasks");
    revalidatePath(`/tasks/decks/${deckId}`);
    return { success: true, count: taskIds.length };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Verify the deck exists and belongs to this org
  const deck = await prisma.taskDeck.findFirst({
    where: {
      id: deckId,
      organizationId: session.user.organizationId,
    },
  });

  if (!deck) {
    throw new Error("Deck not found");
  }

  // Update tasks to belong to this deck
  await prisma.outreachTask.updateMany({
    where: {
      id: { in: taskIds },
      organizationId: session.user.organizationId,
    },
    data: {
      deckId,
    },
  });

  // Update deck task count
  const taskCount = await prisma.outreachTask.count({
    where: { deckId },
  });

  await prisma.taskDeck.update({
    where: { id: deckId },
    data: { totalTasks: taskCount },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/decks/${deckId}`);
  return { success: true, count: taskIds.length };
}

/**
 * Remove a task from a deck
 */
export async function removeTaskFromDeck(deckId: string, taskId: string) {
  // Demo mode: return mock success
  if (await isDemoMode()) {
    revalidatePath("/tasks");
    revalidatePath(`/tasks/decks/${deckId}`);
    return { success: true };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.outreachTask.update({
    where: {
      id: taskId,
      organizationId: session.user.organizationId,
      deckId,
    },
    data: {
      deckId: null,
    },
  });

  // Update deck task count
  const taskCount = await prisma.outreachTask.count({
    where: { deckId },
  });

  await prisma.taskDeck.update({
    where: { id: deckId },
    data: { totalTasks: taskCount },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/decks/${deckId}`);
  return { success: true };
}

/**
 * Create a deck from a campaign (generates tasks and puts them in a new deck)
 */
export async function createDeckFromCampaign(
  campaignId: string,
  deckName: string,
  taskType: "VIDEO" | "HANDWRITTEN_NOTE" | "GIFT" | "EXPERIENCE" | "DIRECT_MAIL" = "VIDEO"
) {
  // Demo mode: return mock success
  if (await isDemoMode()) {
    revalidatePath("/tasks");
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, deckId: `demo-deck-${Date.now()}`, count: 3 };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get the campaign with recipients
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      organizationId: session.user.organizationId,
    },
    include: {
      recipients: {
        include: {
          recipient: true,
        },
      },
    },
  });

  if (!campaign) {
    return { success: false, error: "Campaign not found" };
  }

  if (campaign.recipients.length === 0) {
    return { success: false, error: "Campaign has no recipients" };
  }

  // Create the deck
  const deck = await prisma.taskDeck.create({
    data: {
      name: deckName,
      description: campaign.description,
      status: "SEALED",
      totalTasks: campaign.recipients.length,
      sourceType: "campaign",
      sourceId: campaignId,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
  });

  // Get the next sortOrder
  const lastTask = await prisma.outreachTask.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  let sortOrder = (lastTask?.sortOrder ?? -1) + 1;

  // Create task title based on type
  const taskTitles: Record<string, string> = {
    VIDEO: `Record personalized video for ${campaign.name}`,
    HANDWRITTEN_NOTE: `Write handwritten note for ${campaign.name}`,
    GIFT: `Send gift for ${campaign.name}`,
    EXPERIENCE: `Book experience for ${campaign.name}`,
    DIRECT_MAIL: `Send direct mail for ${campaign.name}`,
  };

  // Create tasks for all recipients
  await prisma.outreachTask.createMany({
    data: campaign.recipients.map((cr: { recipientId: string; recipient: { firstName: string | null; lastName: string | null; company: string | null; notes: string | null } }) => ({
      recipientId: cr.recipientId,
      taskType,
      title: taskTitles[taskType],
      description: campaign.description || null,
      context: JSON.stringify({
        campaignName: campaign.name,
        recipientName: `${cr.recipient.firstName || ""} ${cr.recipient.lastName || ""}`.trim(),
        company: cr.recipient.company,
        notes: cr.recipient.notes,
      }),
      status: "PENDING",
      priority: 3,
      campaignId,
      deckId: deck.id,
      organizationId: session.user.organizationId!,
      sortOrder: sortOrder++,
      assignedToId: session.user.id,
    })),
  });

  revalidatePath("/tasks");
  revalidatePath(`/campaigns/${campaignId}`);

  return { success: true, deckId: deck.id, count: campaign.recipients.length };
}

/**
 * Get tasks not assigned to any deck (unassigned tasks)
 */
export async function getUnassignedTasks() {
  // Demo mode: return tasks without a deckId
  if (await isDemoMode()) {
    const { demoOutreachTasks, demoRecipients } = await import("@/lib/demo-data");
    const unassigned = demoOutreachTasks
      .filter((t) => !t.deckId && (t.status === "PENDING" || t.status === "IN_PROGRESS"))
      .map((task) => ({
        ...task,
        recipient: demoRecipients.find((r) => r.id === task.recipientId) || demoRecipients[0],
      }));
    return { tasks: unassigned, total: unassigned.length };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return { tasks: [], total: 0 };
  }

  const [tasks, total] = await Promise.all([
    prisma.outreachTask.findMany({
      where: {
        organizationId: session.user.organizationId,
        deckId: null,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
            jobTitle: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { sortOrder: "asc" }],
      take: 100,
    }),
    prisma.outreachTask.count({
      where: {
        organizationId: session.user.organizationId,
        deckId: null,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    }),
  ]);

  return { tasks, total };
}

/**
 * Get unassigned tasks due within the next X days
 */
export async function getTasksDueSoon(days: number) {
  // Demo mode: return filtered demo tasks
  if (await isDemoMode()) {
    const { demoOutreachTasks, demoRecipients } = await import("@/lib/demo-data");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const filtered = demoOutreachTasks
      .filter(
        (t) =>
          !t.deckId &&
          (t.status === "PENDING" || t.status === "IN_PROGRESS") &&
          t.dueDate &&
          new Date(t.dueDate) <= cutoff
      )
      .map((task) => ({
        ...task,
        recipient: demoRecipients.find((r) => r.id === task.recipientId) || demoRecipients[0],
      }));
    return { tasks: filtered, total: filtered.length };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return { tasks: [], total: 0 };
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  const where = {
    organizationId: session.user.organizationId,
    deckId: null,
    status: { in: ["PENDING", "IN_PROGRESS"] as string[] },
    dueDate: { lte: cutoff },
  };

  const [tasks, total] = await Promise.all([
    prisma.outreachTask.findMany({
      where,
      include: {
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
            jobTitle: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 100,
    }),
    prisma.outreachTask.count({ where }),
  ]);

  return { tasks, total };
}

/**
 * Delete a task deck (tasks are not deleted, just unassigned)
 */
export async function deleteTaskDeck(id: string) {
  // Demo mode: return mock success
  if (await isDemoMode()) {
    revalidatePath("/tasks");
    return { success: true };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // First, unassign all tasks from this deck
  await prisma.outreachTask.updateMany({
    where: {
      deckId: id,
      organizationId: session.user.organizationId,
    },
    data: {
      deckId: null,
    },
  });

  // Then delete the deck
  await prisma.taskDeck.delete({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/tasks");
  return { success: true };
}

/**
 * Update deck stats (called after task completion)
 */
export async function updateDeckStats(deckId: string) {
  // Demo mode: no-op, stats are static
  if (await isDemoMode()) {
    revalidatePath("/tasks");
    revalidatePath(`/tasks/decks/${deckId}`);
    return;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const stats = await prisma.outreachTask.groupBy({
    by: ["status"],
    where: { deckId },
    _count: true,
  });

  type StatEntry = { status: string; _count: number };
  const totalTasks = stats.reduce((sum: number, s: StatEntry) => sum + s._count, 0);
  const completedTasks = stats.find((s: StatEntry) => s.status === "COMPLETED")?._count || 0;
  const skippedTasks = stats.find((s: StatEntry) => s.status === "SKIPPED")?._count || 0;

  // Check if deck should be marked as completed
  const pendingOrInProgress = stats.filter(
    (s: StatEntry) => s.status === "PENDING" || s.status === "IN_PROGRESS"
  );
  const allDone = pendingOrInProgress.length === 0 || pendingOrInProgress.every((s: StatEntry) => s._count === 0);

  await prisma.taskDeck.update({
    where: { id: deckId },
    data: {
      totalTasks,
      completedTasks,
      skippedTasks,
      ...(allDone && { status: "COMPLETED", completedAt: new Date() }),
    },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/decks/${deckId}`);
}

/**
 * Create a random deck with randomly selected tasks
 */
export async function createRandomDeck(taskCount: number) {
  // Check for demo mode first
  if (await isDemoMode()) {
    const { demoOutreachTasks, demoRecipients } = await import("@/lib/demo-data");

    // Shuffle and pick random tasks
    const availableTasks = demoOutreachTasks.filter(
      (t) => t.status === "PENDING" || t.status === "IN_PROGRESS"
    );

    if (availableTasks.length === 0) {
      return { success: false, error: "No available tasks to add to deck" };
    }

    const count = Math.min(taskCount, availableTasks.length);

    // Create a mock deck for demo mode
    const randomEmojis = ["🎲", "🎰", "🃏", "🎯", "⚡", "🔥", "✨", "🚀"];
    const randomColors = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

    return {
      success: true,
      deckId: "demo-random-deck",
      count,
      message: `Created random deck with ${count} tasks (demo mode)`,
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get available tasks (pending/in-progress, not in a deck)
  const availableTasks = await prisma.outreachTask.findMany({
    where: {
      organizationId: session.user.organizationId,
      deckId: null,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    select: { id: true },
  });

  if (availableTasks.length === 0) {
    return { success: false, error: "No available tasks to add to deck" };
  }

  // Shuffle array using Fisher-Yates algorithm
  const shuffled = [...availableTasks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Take the requested number of tasks
  const count = Math.min(taskCount, shuffled.length);
  const selectedTaskIds = shuffled.slice(0, count).map((t) => t.id);

  // Random deck styling
  const randomEmojis = ["🎲", "🎰", "🃏", "🎯", "⚡", "🔥", "✨", "🚀"];
  const randomColors = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];
  const emoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
  const color = randomColors[Math.floor(Math.random() * randomColors.length)];

  // Create the deck
  const deck = await prisma.taskDeck.create({
    data: {
      name: `Random Pack (${count} tasks)`,
      description: "A randomly generated pack of tasks to work through",
      coverColor: color,
      emoji: emoji,
      status: "SEALED",
      totalTasks: count,
      sourceType: "random",
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
  });

  // Assign selected tasks to this deck
  await prisma.outreachTask.updateMany({
    where: {
      id: { in: selectedTaskIds },
      organizationId: session.user.organizationId,
    },
    data: {
      deckId: deck.id,
    },
  });

  revalidatePath("/tasks");
  return { success: true, deckId: deck.id, count };
}

/**
 * Get count of available tasks for random deck creation
 */
export async function getAvailableTaskCount() {
  // Check for demo mode first
  if (await isDemoMode()) {
    const { demoOutreachTasks } = await import("@/lib/demo-data");
    const available = demoOutreachTasks.filter(
      (t) => t.status === "PENDING" || t.status === "IN_PROGRESS"
    );
    return available.length;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return 0;
  }

  return prisma.outreachTask.count({
    where: {
      organizationId: session.user.organizationId,
      deckId: null,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  completedTasks: number;
  skippedTasks: number;
  totalCompleted: number;
  streak: number;
  bestStreak: number;
  rank: number;
  isCurrentUser: boolean;
  // Analytics fields
  completionRate: number; // Percentage (0-100)
  avgPerDay: number; // Average tasks completed per day in period
  tasksByType: {
    VIDEO: number;
    HANDWRITTEN_NOTE: number;
    GIFT: number;
    EXPERIENCE: number;
    DIRECT_MAIL: number;
  };
  trend: "up" | "down" | "same"; // Compared to previous period
  previousRank: number | null; // Rank in previous period
}

export interface LeaderboardStats {
  teamTotal: number;
  teamAvgPerUser: number;
  topTaskType: string;
  periodDays: number;
}

/**
 * Get leaderboard data for the organization
 */
export async function getLeaderboard(period: "week" | "month" | "all" = "week") {
  const periodDays = period === "week" ? 7 : period === "month" ? 30 : 365;

  // Check for demo mode first
  if (await isDemoMode()) {
    // Return demo leaderboard data with full analytics
    const demoLeaderboard: LeaderboardEntry[] = [
      {
        userId: DEMO_USER_ID,
        name: "You",
        email: "demo@example.com",
        image: null,
        completedTasks: 12,
        skippedTasks: 2,
        totalCompleted: 12,
        streak: 5,
        bestStreak: 8,
        rank: 1,
        isCurrentUser: true,
        completionRate: 86,
        avgPerDay: 1.7,
        tasksByType: { VIDEO: 5, HANDWRITTEN_NOTE: 3, GIFT: 2, EXPERIENCE: 1, DIRECT_MAIL: 1 },
        trend: "up",
        previousRank: 2,
      },
      {
        userId: "demo-user-2",
        name: "Sarah Chen",
        email: "sarah@example.com",
        image: null,
        completedTasks: 10,
        skippedTasks: 1,
        totalCompleted: 10,
        streak: 3,
        bestStreak: 7,
        rank: 2,
        isCurrentUser: false,
        completionRate: 91,
        avgPerDay: 1.4,
        tasksByType: { VIDEO: 4, HANDWRITTEN_NOTE: 2, GIFT: 3, EXPERIENCE: 1, DIRECT_MAIL: 0 },
        trend: "down",
        previousRank: 1,
      },
      {
        userId: "demo-user-3",
        name: "Mike Johnson",
        email: "mike@example.com",
        image: null,
        completedTasks: 8,
        skippedTasks: 3,
        totalCompleted: 8,
        streak: 2,
        bestStreak: 4,
        rank: 3,
        isCurrentUser: false,
        completionRate: 73,
        avgPerDay: 1.1,
        tasksByType: { VIDEO: 2, HANDWRITTEN_NOTE: 1, GIFT: 3, EXPERIENCE: 2, DIRECT_MAIL: 0 },
        trend: "same",
        previousRank: 3,
      },
      {
        userId: "demo-user-4",
        name: "Emily Davis",
        email: "emily@example.com",
        image: null,
        completedTasks: 6,
        skippedTasks: 0,
        totalCompleted: 6,
        streak: 6,
        bestStreak: 12,
        rank: 4,
        isCurrentUser: false,
        completionRate: 100,
        avgPerDay: 0.9,
        tasksByType: { VIDEO: 2, HANDWRITTEN_NOTE: 2, GIFT: 1, EXPERIENCE: 0, DIRECT_MAIL: 1 },
        trend: "up",
        previousRank: 5,
      },
      {
        userId: "demo-user-5",
        name: "Alex Thompson",
        email: "alex@example.com",
        image: null,
        completedTasks: 4,
        skippedTasks: 2,
        totalCompleted: 4,
        streak: 1,
        bestStreak: 3,
        rank: 5,
        isCurrentUser: false,
        completionRate: 67,
        avgPerDay: 0.6,
        tasksByType: { VIDEO: 1, HANDWRITTEN_NOTE: 1, GIFT: 1, EXPERIENCE: 1, DIRECT_MAIL: 0 },
        trend: "down",
        previousRank: 4,
      },
    ];

    const stats: LeaderboardStats = {
      teamTotal: 40,
      teamAvgPerUser: 8,
      topTaskType: "VIDEO",
      periodDays,
    };

    return {
      leaderboard: demoLeaderboard,
      currentUserRank: 1,
      totalParticipants: 5,
      period,
      stats,
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId || !session?.user?.id) {
    return { leaderboard: [], currentUserRank: 0, totalParticipants: 0, period };
  }

  // Calculate date range based on period
  let startDate: Date | undefined;
  let previousStartDate: Date | undefined;
  let previousEndDate: Date | undefined;
  const now = new Date();

  if (period === "week") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - 7);
    previousEndDate = new Date(startDate);
  } else if (period === "month") {
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 1);
    previousStartDate = new Date(startDate);
    previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    previousEndDate = new Date(startDate);
  }

  // Get all users in the organization
  const users = await prisma.user.findMany({
    where: {
      organizationId: session.user.organizationId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  // Task types for grouping
  const taskTypes = ["VIDEO", "HANDWRITTEN_NOTE", "GIFT", "EXPERIENCE", "DIRECT_MAIL"] as const;

  const userIds = users.map((u) => u.id);

  // Batch query 1: Get completed & skipped counts per user (replaces 2 queries per user)
  const statusCounts = await prisma.outreachTask.groupBy({
    by: ["completedById", "status"],
    where: {
      completedById: { in: userIds },
      status: { in: ["COMPLETED", "SKIPPED"] },
      ...(startDate && { completedAt: { gte: startDate } }),
    },
    _count: true,
  });

  // Batch query 2: Get previous period counts per user (replaces 1 query per user)
  let previousCounts: { completedById: string | null; _count: number }[] = [];
  if (previousStartDate && previousEndDate) {
    previousCounts = await prisma.outreachTask.groupBy({
      by: ["completedById"],
      where: {
        completedById: { in: userIds },
        status: "COMPLETED",
        completedAt: { gte: previousStartDate, lt: previousEndDate },
      },
      _count: true,
    });
  }

  // Batch query 3: Get task type breakdown per user (replaces 1 query per user)
  const taskTypeBreakdown = await prisma.outreachTask.groupBy({
    by: ["completedById", "taskType"],
    where: {
      completedById: { in: userIds },
      status: "COMPLETED",
      ...(startDate && { completedAt: { gte: startDate } }),
    },
    _count: true,
  });

  // Batch query 4: Get recent completions for streak calculation (replaces 1 query per user)
  const recentCompletions = await prisma.outreachTask.findMany({
    where: {
      completedById: { in: userIds },
      status: "COMPLETED",
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    select: { completedById: true, completedAt: true },
  });

  // Build lookup maps from batch results
  const completedMap = new Map<string, number>();
  const skippedMap = new Map<string, number>();
  for (const row of statusCounts) {
    if (!row.completedById) continue;
    if (row.status === "COMPLETED") completedMap.set(row.completedById, row._count);
    if (row.status === "SKIPPED") skippedMap.set(row.completedById, row._count);
  }

  const previousMap = new Map<string, number>();
  for (const row of previousCounts) {
    if (row.completedById) previousMap.set(row.completedById, row._count);
  }

  const tasksByTypeMap = new Map<string, Record<string, number>>();
  for (const row of taskTypeBreakdown) {
    if (!row.completedById) continue;
    if (!tasksByTypeMap.has(row.completedById)) {
      tasksByTypeMap.set(row.completedById, { VIDEO: 0, HANDWRITTEN_NOTE: 0, GIFT: 0, EXPERIENCE: 0, DIRECT_MAIL: 0 });
    }
    const map = tasksByTypeMap.get(row.completedById)!;
    if (row.taskType in map) {
      map[row.taskType] = row._count;
    }
  }

  // Group recent completions by user for streak calculation
  const completionsByUser = new Map<string, Date[]>();
  for (const row of recentCompletions) {
    if (!row.completedById || !row.completedAt) continue;
    if (!completionsByUser.has(row.completedById)) {
      completionsByUser.set(row.completedById, []);
    }
    completionsByUser.get(row.completedById)!.push(row.completedAt);
  }

  // Build user stats from lookup maps (no additional queries)
  type UserEntry = { id: string; name: string | null; email: string | null; image: string | null };
  const userStats = users.map((user: UserEntry) => {
    const completed = completedMap.get(user.id) || 0;
    const skipped = skippedMap.get(user.id) || 0;
    const previousCompleted = previousMap.get(user.id) || 0;
    const tasksByType = tasksByTypeMap.get(user.id) || {
      VIDEO: 0, HANDWRITTEN_NOTE: 0, GIFT: 0, EXPERIENCE: 0, DIRECT_MAIL: 0,
    };

    // Calculate streak from pre-fetched completions
    const userCompletions = completionsByUser.get(user.id) || [];
    let streak = 0;
    let bestStreak = 0;
    let currentStreak = 0;

    if (userCompletions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let checkDate = new Date(today);
      let lastDate: Date | null = null;

      // Only look at first 60 completions for streak
      const limited = userCompletions.slice(0, 60);
      for (const completedAt of limited) {
        const completionDate = new Date(completedAt);
        completionDate.setHours(0, 0, 0, 0);

        if (streak === currentStreak) {
          if (completionDate.getTime() === checkDate.getTime()) {
            streak++;
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          }
        }

        if (lastDate === null) {
          currentStreak = 1;
        } else {
          const diffDays = Math.round((lastDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak++;
          } else if (diffDays > 1) {
            bestStreak = Math.max(bestStreak, currentStreak);
            currentStreak = 1;
          }
        }
        lastDate = completionDate;
      }
      bestStreak = Math.max(bestStreak, currentStreak, streak);
    }

    const totalAttempted = completed + skipped;
    const completionRate = totalAttempted > 0 ? Math.round((completed / totalAttempted) * 100) : 0;
    const avgPerDay = Math.round((completed / periodDays) * 10) / 10;

    let trend: "up" | "down" | "same" = "same";
    if (previousCompleted > 0 || completed > 0) {
      if (completed > previousCompleted) trend = "up";
      else if (completed < previousCompleted) trend = "down";
    }

    return {
      userId: user.id,
      name: user.name || "Unknown",
      email: user.email || "",
      image: user.image,
      completedTasks: completed,
      skippedTasks: skipped,
      totalCompleted: completed,
      streak,
      bestStreak,
      completionRate,
      avgPerDay,
      tasksByType,
      trend,
      previousCompleted,
      isCurrentUser: user.id === session.user.id,
    };
  });

  // Sort by completed tasks (descending) and assign ranks
  const sortedStats = userStats
    .filter((s) => s.completedTasks > 0 || s.isCurrentUser)
    .sort((a, b) => b.completedTasks - a.completedTasks)
    .map((stat, index) => ({
      ...stat,
      rank: index + 1,
    }));

  // Calculate previous ranks for trend arrows
  const previousSortedStats = [...userStats]
    .sort((a, b) => b.previousCompleted - a.previousCompleted)
    .map((stat, index) => ({
      userId: stat.userId,
      previousRank: stat.previousCompleted > 0 ? index + 1 : null,
    }));

  // Merge previous ranks
  const finalStats = sortedStats.map((stat) => {
    const prev = previousSortedStats.find((p) => p.userId === stat.userId);
    return {
      ...stat,
      previousRank: prev?.previousRank || null,
    };
  });

  const currentUserRank = finalStats.find((s) => s.isCurrentUser)?.rank || 0;

  // Calculate team stats
  const teamTotal = userStats.reduce((sum, s) => sum + s.completedTasks, 0);
  const activeUsers = userStats.filter((s) => s.completedTasks > 0).length;
  const teamAvgPerUser = activeUsers > 0 ? Math.round(teamTotal / activeUsers) : 0;

  // Find top task type
  const typeAggregation = taskTypes.reduce((acc, type) => {
    acc[type] = userStats.reduce((sum, s) => sum + s.tasksByType[type], 0);
    return acc;
  }, {} as Record<string, number>);

  const topTaskType = Object.entries(typeAggregation).sort((a, b) => b[1] - a[1])[0]?.[0] || "VIDEO";

  const stats: LeaderboardStats = {
    teamTotal,
    teamAvgPerUser,
    topTaskType,
    periodDays,
  };

  return {
    leaderboard: finalStats.slice(0, 10) as LeaderboardEntry[],
    currentUserRank,
    totalParticipants: sortedStats.length,
    period,
    stats,
  };
}
