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
    if (!deck) return null;

    // Import demo tasks and recipients for demo mode
    const { demoOutreachTasks, demoRecipients } = await import("@/lib/demo-data");

    // For demo, associate tasks with this deck based on deck index
    const deckIndex = demoTaskDecks.findIndex((d) => d.id === id);
    const tasksPerDeck = Math.ceil(demoOutreachTasks.length / demoTaskDecks.length);
    const startIdx = deckIndex * tasksPerDeck;
    const deckTasks = demoOutreachTasks.slice(startIdx, startIdx + deck.totalTasks).map((task) => ({
      ...task,
      deckId: id,
      recipient: demoRecipients.find((r) => r.id === task.recipientId) || demoRecipients[0],
    }));

    return {
      ...deck,
      createdBy: { id: DEMO_USER_ID, name: "Demo User", email: "demo@example.com" },
      tasks: deckTasks,
    };
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
    data: campaign.recipients.map((cr) => ({
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
 * Delete a task deck (tasks are not deleted, just unassigned)
 */
export async function deleteTaskDeck(id: string) {
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
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const stats = await prisma.outreachTask.groupBy({
    by: ["status"],
    where: { deckId },
    _count: true,
  });

  const totalTasks = stats.reduce((sum, s) => sum + s._count, 0);
  const completedTasks = stats.find((s) => s.status === "COMPLETED")?._count || 0;
  const skippedTasks = stats.find((s) => s.status === "SKIPPED")?._count || 0;

  // Check if deck should be marked as completed
  const pendingOrInProgress = stats.filter(
    (s) => s.status === "PENDING" || s.status === "IN_PROGRESS"
  );
  const allDone = pendingOrInProgress.length === 0 || pendingOrInProgress.every((s) => s._count === 0);

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
