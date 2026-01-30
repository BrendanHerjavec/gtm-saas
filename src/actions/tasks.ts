"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import {
  demoOutreachTasks,
  demoRecipients,
  DEMO_USER_ID,
  DEMO_ORG_ID,
} from "@/lib/demo-data";
import type {
  CreateOutreachTaskInput,
  UpdateOutreachTaskInput,
  CompleteOutreachTaskInput,
} from "@/lib/validations";

export type TaskStatus = "all" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
export type TaskType = "all" | "GIFT" | "HANDWRITTEN_NOTE" | "VIDEO" | "EXPERIENCE" | "DIRECT_MAIL";

export interface GetOutreachTasksParams {
  status?: TaskStatus;
  taskType?: TaskType;
  assignedToId?: string;
  campaignId?: string;
  recipientId?: string;
  page?: number;
  limit?: number;
}

export interface OutreachTaskWithRecipient {
  id: string;
  recipientId: string;
  taskType: string;
  title: string;
  description: string | null;
  context: string | null;
  status: string;
  priority: number;
  dueDate: Date | null;
  sortOrder: number;
  campaignId: string | null;
  sendId: string | null;
  completedAt: Date | null;
  completedById: string | null;
  skipReason: string | null;
  assignedToId: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  recipient: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    company: string | null;
    jobTitle: string | null;
    linkedinUrl: string | null;
    address: string | null;
    notes: string | null;
    tags: string | null;
  };
  assignedTo?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

/**
 * Get tasks for the deck (paginated, ordered by priority and sortOrder)
 */
export async function getOutreachTasks(params: GetOutreachTasksParams = {}) {
  const {
    status = "all",
    taskType = "all",
    assignedToId,
    campaignId,
    recipientId,
    page = 1,
    limit = 20,
  } = params;

  // Check for demo mode first
  if (await isDemoMode()) {
    let filtered = demoOutreachTasks.map((task) => ({
      ...task,
      recipient: demoRecipients.find((r) => r.id === task.recipientId)!,
      assignedTo: task.assignedToId
        ? { id: DEMO_USER_ID, name: "Demo User", email: "demo@example.com" }
        : null,
    }));

    if (status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (taskType !== "all") {
      filtered = filtered.filter((t) => t.taskType === taskType);
    }
    if (assignedToId) {
      filtered = filtered.filter((t) => t.assignedToId === assignedToId);
    }
    if (campaignId) {
      filtered = filtered.filter((t) => t.campaignId === campaignId);
    }
    if (recipientId) {
      filtered = filtered.filter((t) => t.recipientId === recipientId);
    }

    // Sort by priority (descending) then sortOrder (ascending)
    filtered.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.sortOrder - b.sortOrder;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return {
      tasks: paged as OutreachTaskWithRecipient[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return { tasks: [], total: 0, page: 1, totalPages: 0 };
  }

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    organizationId: session.user.organizationId,
  };

  if (status !== "all") {
    where.status = status;
  }
  if (taskType !== "all") {
    where.taskType = taskType;
  }
  if (assignedToId) {
    where.assignedToId = assignedToId;
  }
  if (campaignId) {
    where.campaignId = campaignId;
  }
  if (recipientId) {
    where.recipientId = recipientId;
  }

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
            phone: true,
            company: true,
            jobTitle: true,
            linkedinUrl: true,
            address: true,
            notes: true,
            tags: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ priority: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.outreachTask.count({ where }),
  ]);

  return {
    tasks: tasks as OutreachTaskWithRecipient[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get a single task with full recipient context
 */
export async function getOutreachTask(id: string) {
  // Check for demo mode first
  if (await isDemoMode()) {
    const task = demoOutreachTasks.find((t) => t.id === id);
    if (!task) return null;

    return {
      ...task,
      recipient: demoRecipients.find((r) => r.id === task.recipientId)!,
      assignedTo: task.assignedToId
        ? { id: DEMO_USER_ID, name: "Demo User", email: "demo@example.com" }
        : null,
    } as OutreachTaskWithRecipient;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return null;
  }

  return prisma.outreachTask.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      recipient: true,
      campaign: true,
      send: true,
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
      completedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/**
 * Get the current task in the deck (first pending/in-progress task)
 */
export async function getCurrentTask(taskType: TaskType = "all") {
  // Check for demo mode first
  if (await isDemoMode()) {
    let filtered = demoOutreachTasks.filter(
      (t) => t.status === "PENDING" || t.status === "IN_PROGRESS"
    );

    if (taskType !== "all") {
      filtered = filtered.filter((t) => t.taskType === taskType);
    }

    // Sort by priority (descending) then sortOrder (ascending)
    filtered.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.sortOrder - b.sortOrder;
    });

    const task = filtered[0];
    if (!task) return null;

    const position = filtered.findIndex((t) => t.id === task.id) + 1;

    return {
      task: {
        ...task,
        recipient: demoRecipients.find((r) => r.id === task.recipientId)!,
        assignedTo: task.assignedToId
          ? { id: DEMO_USER_ID, name: "Demo User", email: "demo@example.com" }
          : null,
      } as OutreachTaskWithRecipient,
      position,
      total: filtered.length,
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return null;
  }

  const where: Record<string, unknown> = {
    organizationId: session.user.organizationId,
    status: { in: ["PENDING", "IN_PROGRESS"] },
  };

  if (taskType !== "all") {
    where.taskType = taskType;
  }

  const [task, total] = await Promise.all([
    prisma.outreachTask.findFirst({
      where,
      include: {
        recipient: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ priority: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.outreachTask.count({ where }),
  ]);

  if (!task) return null;

  return {
    task: task as OutreachTaskWithRecipient,
    position: 1,
    total,
  };
}

/**
 * Get deck stats (total pending, by type, etc.)
 */
export async function getTaskDeckStats() {
  // Check for demo mode first
  if (await isDemoMode()) {
    const pending = demoOutreachTasks.filter((t) => t.status === "PENDING").length;
    const inProgress = demoOutreachTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completed = demoOutreachTasks.filter((t) => t.status === "COMPLETED").length;
    const skipped = demoOutreachTasks.filter((t) => t.status === "SKIPPED").length;

    const byType = {
      GIFT: demoOutreachTasks.filter((t) => t.taskType === "GIFT" && t.status === "PENDING").length,
      HANDWRITTEN_NOTE: demoOutreachTasks.filter(
        (t) => t.taskType === "HANDWRITTEN_NOTE" && t.status === "PENDING"
      ).length,
      VIDEO: demoOutreachTasks.filter((t) => t.taskType === "VIDEO" && t.status === "PENDING")
        .length,
      EXPERIENCE: demoOutreachTasks.filter(
        (t) => t.taskType === "EXPERIENCE" && t.status === "PENDING"
      ).length,
      DIRECT_MAIL: demoOutreachTasks.filter(
        (t) => t.taskType === "DIRECT_MAIL" && t.status === "PENDING"
      ).length,
    };

    return {
      total: demoOutreachTasks.length,
      pending,
      inProgress,
      completed,
      skipped,
      actionable: pending + inProgress,
      byType,
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      skipped: 0,
      actionable: 0,
      byType: { GIFT: 0, HANDWRITTEN_NOTE: 0, VIDEO: 0, EXPERIENCE: 0, DIRECT_MAIL: 0 },
    };
  }

  const orgWhere = { organizationId: session.user.organizationId };

  const [total, pending, inProgress, completed, skipped, byTypeResults] = await Promise.all([
    prisma.outreachTask.count({ where: orgWhere }),
    prisma.outreachTask.count({ where: { ...orgWhere, status: "PENDING" } }),
    prisma.outreachTask.count({ where: { ...orgWhere, status: "IN_PROGRESS" } }),
    prisma.outreachTask.count({ where: { ...orgWhere, status: "COMPLETED" } }),
    prisma.outreachTask.count({ where: { ...orgWhere, status: "SKIPPED" } }),
    prisma.outreachTask.groupBy({
      by: ["taskType"],
      where: { ...orgWhere, status: "PENDING" },
      _count: true,
    }),
  ]);

  const byType: { GIFT: number; HANDWRITTEN_NOTE: number; VIDEO: number; EXPERIENCE: number; DIRECT_MAIL: number } = {
    GIFT: 0,
    HANDWRITTEN_NOTE: 0,
    VIDEO: 0,
    EXPERIENCE: 0,
    DIRECT_MAIL: 0,
  };

  for (const result of byTypeResults) {
    if (result.taskType in byType) {
      byType[result.taskType as keyof typeof byType] = result._count;
    }
  }

  return {
    total,
    pending,
    inProgress,
    completed,
    skipped,
    actionable: pending + inProgress,
    byType,
  };
}

/**
 * Create a new manual task
 */
export async function createOutreachTask(input: CreateOutreachTaskInput) {
  // Demo mode: return mock task
  if (await isDemoMode()) {
    const recipient = demoRecipients.find((r) => r.id === input.recipientId) || demoRecipients[0];
    const mockTask = {
      id: `demo-task-${Date.now()}`,
      ...input,
      organizationId: DEMO_ORG_ID,
      sortOrder: demoOutreachTasks.length,
      assignedToId: input.assignedToId || DEMO_USER_ID,
      status: "PENDING",
      completedAt: null,
      completedById: null,
      skipReason: null,
      sendId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      recipient,
    };
    revalidatePath("/tasks");
    return mockTask;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get the next sortOrder
  const lastTask = await prisma.outreachTask.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const task = await prisma.outreachTask.create({
    data: {
      ...input,
      organizationId: session.user.organizationId,
      sortOrder: (lastTask?.sortOrder ?? -1) + 1,
      assignedToId: input.assignedToId || session.user.id,
    },
    include: {
      recipient: true,
    },
  });

  revalidatePath("/tasks");
  return task;
}

/**
 * Update task (status, notes, etc.)
 */
export async function updateOutreachTask(id: string, input: UpdateOutreachTaskInput) {
  // Demo mode: return mock updated task
  if (await isDemoMode()) {
    const task = demoOutreachTasks.find((t) => t.id === id);
    if (!task) throw new Error("Task not found");
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${id}`);
    return { ...task, ...input, updatedAt: new Date() };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const task = await prisma.outreachTask.update({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: input,
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  return task;
}

/**
 * Start working on a task (mark as in progress)
 */
export async function startOutreachTask(id: string) {
  // Demo mode: return mock in-progress task
  if (await isDemoMode()) {
    const task = demoOutreachTasks.find((t) => t.id === id);
    if (!task) throw new Error("Task not found");
    revalidatePath("/tasks");
    return { ...task, status: "IN_PROGRESS", updatedAt: new Date() };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const task = await prisma.outreachTask.update({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: {
      status: "IN_PROGRESS",
    },
  });

  revalidatePath("/tasks");
  return task;
}

/**
 * Complete a task (creates a Send and marks complete)
 */
export async function completeOutreachTask(input: CompleteOutreachTaskInput) {
  // Demo mode: return mock completed task and send
  if (await isDemoMode()) {
    const task = demoOutreachTasks.find((t) => t.id === input.taskId);
    if (!task) throw new Error("Task not found");
    const updatedTask = {
      ...task,
      status: "COMPLETED",
      completedAt: new Date(),
      completedById: DEMO_USER_ID,
      sendId: `demo-send-${Date.now()}`,
      updatedAt: new Date(),
    };
    const mockSend = {
      id: updatedTask.sendId,
      recipientId: task.recipientId,
      organizationId: DEMO_ORG_ID,
      userId: DEMO_USER_ID,
      type: task.taskType,
      status: "PENDING",
      message: input.message,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    revalidatePath("/tasks");
    revalidatePath("/sends");
    return { task: updatedTask, send: mockSend };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get the task
  const task = await prisma.outreachTask.findFirst({
    where: {
      id: input.taskId,
      organizationId: session.user.organizationId,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  // Create a Send record for the completed task
  const send = await prisma.send.create({
    data: {
      recipientId: task.recipientId,
      organizationId: session.user.organizationId,
      userId: session.user.id,
      type: task.taskType,
      status: "PENDING",
      message: input.message,
      videoUrl: input.videoUrl || null,
      giftItemId: input.giftItemId || null,
      notes: input.notes,
      campaignId: task.campaignId,
      triggerType: "manual",
    },
  });

  // Update the task as completed
  const updatedTask = await prisma.outreachTask.update({
    where: { id: input.taskId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedById: session.user.id,
      sendId: send.id,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/sends");
  return { task: updatedTask, send };
}

/**
 * Skip a task (move to next without completing)
 */
export async function skipOutreachTask(id: string, reason?: string) {
  // Demo mode: return mock skipped task
  if (await isDemoMode()) {
    const task = demoOutreachTasks.find((t) => t.id === id);
    if (!task) throw new Error("Task not found");
    revalidatePath("/tasks");
    return {
      ...task,
      status: "SKIPPED",
      skipReason: reason || null,
      completedAt: new Date(),
      completedById: DEMO_USER_ID,
      updatedAt: new Date(),
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const task = await prisma.outreachTask.update({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: {
      status: "SKIPPED",
      skipReason: reason,
      completedAt: new Date(),
      completedById: session.user.id,
    },
  });

  revalidatePath("/tasks");
  return task;
}

/**
 * Delete a task
 */
export async function deleteOutreachTask(id: string) {
  // Demo mode: return mock success
  if (await isDemoMode()) {
    revalidatePath("/tasks");
    return { success: true };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.outreachTask.delete({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/tasks");
  return { success: true };
}

/**
 * Batch create tasks for multiple recipients
 */
export async function createBatchOutreachTasks(
  recipientIds: string[],
  taskTemplate: Omit<CreateOutreachTaskInput, "recipientId">
) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get the next sortOrder
  const lastTask = await prisma.outreachTask.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  let sortOrder = (lastTask?.sortOrder ?? -1) + 1;

  const tasks = await prisma.outreachTask.createMany({
    data: recipientIds.map((recipientId) => ({
      ...taskTemplate,
      recipientId,
      organizationId: session.user.organizationId!,
      sortOrder: sortOrder++,
      assignedToId: taskTemplate.assignedToId || session.user.id,
    })),
  });

  revalidatePath("/tasks");
  return { count: tasks.count };
}

/**
 * Generate tasks from a campaign
 * Creates tasks for each recipient in the campaign based on campaign steps
 */
export async function generateTasksFromCampaign(
  campaignId: string,
  taskType: "VIDEO" | "HANDWRITTEN_NOTE" | "GIFT" | "EXPERIENCE" | "DIRECT_MAIL" = "VIDEO"
): Promise<{ success: boolean; count: number; error?: string }> {
  const session = await getAuthSession();
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
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
      return { success: false, count: 0, error: "Campaign not found" };
    }

    if (campaign.recipients.length === 0) {
      return { success: false, count: 0, error: "Campaign has no recipients" };
    }

    // Get existing tasks for this campaign to avoid duplicates
    const existingTasks = await prisma.outreachTask.findMany({
      where: {
        campaignId,
        organizationId: session.user.organizationId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      select: { recipientId: true },
    });

    const existingRecipientIds = new Set(existingTasks.map((t: { recipientId: string }) => t.recipientId));

    // Filter out recipients who already have pending tasks
    const recipientsToAdd = campaign.recipients.filter(
      (cr: { recipientId: string }) => !existingRecipientIds.has(cr.recipientId)
    );

    if (recipientsToAdd.length === 0) {
      return {
        success: false,
        count: 0,
        error: "All recipients already have pending tasks for this campaign",
      };
    }

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
    const tasks = await prisma.outreachTask.createMany({
      data: recipientsToAdd.map((cr: { recipientId: string; recipient: { firstName: string | null; lastName: string | null; company: string | null; notes: string | null } }) => ({
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
        organizationId: session.user.organizationId!,
        sortOrder: sortOrder++,
        assignedToId: session.user.id,
      })),
    });

    revalidatePath("/tasks");
    revalidatePath(`/campaigns/${campaignId}`);

    return { success: true, count: tasks.count };
  } catch (error) {
    console.error("Failed to generate tasks from campaign:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Failed to generate tasks",
    };
  }
}
