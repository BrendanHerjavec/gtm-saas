"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { demoRecipients, DEMO_ORG_ID } from "@/lib/demo-data";
import { createRecipientSchema, updateRecipientSchema, validateInput } from "@/lib/validations";

export type RecipientStatus = "all" | "active" | "do_not_send";

export interface GetRecipientsParams {
  status?: RecipientStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getRecipients(params: GetRecipientsParams = {}) {
  // Check for demo mode first
  if (await isDemoMode()) {
    const { status = "all", search, page = 1, limit = 20 } = params;
    let filtered = [...demoRecipients];

    if (status === "active") {
      filtered = filtered.filter(r => !r.doNotSend);
    } else if (status === "do_not_send") {
      filtered = filtered.filter(r => r.doNotSend);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.email.toLowerCase().includes(searchLower) ||
        r.firstName?.toLowerCase().includes(searchLower) ||
        r.lastName?.toLowerCase().includes(searchLower) ||
        r.company?.toLowerCase().includes(searchLower)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return {
      recipients: paged,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return { recipients: [], total: 0, page: 1, totalPages: 0 };
  }

  const { status = "all", search, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    organizationId: session.user.organizationId,
  };

  if (status === "active") {
    where.doNotSend = false;
  } else if (status === "do_not_send") {
    where.doNotSend = true;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const [recipients, total] = await Promise.all([
    prisma.recipient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.recipient.count({ where }),
  ]);

  return {
    recipients,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRecipient(id: string) {
  // Check for demo mode first
  if (await isDemoMode()) {
    const recipient = demoRecipients.find(r => r.id === id);
    if (recipient) {
      return { ...recipient, sends: [] };
    }
    return null;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return null;
  }

  return prisma.recipient.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      sends: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export interface CreateRecipientInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  address?: string;
  notes?: string;
  tags?: string;
  preferences?: string;
}

export async function createRecipient(input: CreateRecipientInput) {
  // Validate input
  const validation = validateInput(createRecipientSchema, input);
  if (!validation.success) {
    throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
  }

  // Handle demo mode - simulate creation without database
  if (await isDemoMode()) {
    const mockRecipient = {
      id: `demo-recipient-${Date.now()}`,
      ...input,
      organizationId: DEMO_ORG_ID,
      doNotSend: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    revalidatePath("/recipients");
    return mockRecipient;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const recipient = await prisma.recipient.create({
    data: {
      ...input,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/recipients");
  return recipient;
}

export async function updateRecipient(id: string, input: Partial<CreateRecipientInput> & { doNotSend?: boolean }) {
  // Validate input
  const validation = validateInput(updateRecipientSchema, input);
  if (!validation.success) {
    throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
  }

  // Handle demo mode - simulate update without database
  if (await isDemoMode()) {
    const existingRecipient = demoRecipients.find(r => r.id === id);
    if (!existingRecipient) {
      throw new Error("Recipient not found");
    }

    const mockUpdatedRecipient = {
      ...existingRecipient,
      ...input,
      updatedAt: new Date(),
    };

    revalidatePath("/recipients");
    revalidatePath(`/recipients/${id}`);
    return mockUpdatedRecipient;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const recipient = await prisma.recipient.update({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data: input,
  });

  revalidatePath("/recipients");
  revalidatePath(`/recipients/${id}`);
  return recipient;
}

export interface BulkCreateResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; email: string; error: string }>;
}

export async function bulkCreateRecipients(
  recipients: CreateRecipientInput[]
): Promise<BulkCreateResult> {
  if (recipients.length > 1000) {
    return {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [{ row: 0, email: "", error: "Maximum 1000 recipients per import" }],
    };
  }

  // Demo mode
  if (await isDemoMode()) {
    revalidatePath("/recipients");
    return {
      imported: recipients.length,
      skipped: 0,
      failed: 0,
      errors: [],
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;
  const inputEmails = recipients.map((r) => r.email.toLowerCase());

  // Find existing emails in this org
  const existing = await prisma.recipient.findMany({
    where: {
      organizationId,
      email: { in: inputEmails, mode: "insensitive" },
    },
    select: { email: true },
  });
  const existingSet = new Set(existing.map((r) => r.email.toLowerCase()));

  // Separate new vs duplicate
  const toCreate: CreateRecipientInput[] = [];
  let skipped = 0;

  for (const recipient of recipients) {
    if (existingSet.has(recipient.email.toLowerCase())) {
      skipped++;
    } else {
      toCreate.push(recipient);
    }
  }

  // Bulk insert
  let imported = 0;
  const errors: BulkCreateResult["errors"] = [];

  if (toCreate.length > 0) {
    try {
      const result = await prisma.recipient.createMany({
        data: toCreate.map((r) => ({
          ...r,
          organizationId,
        })),
        skipDuplicates: true,
      });
      imported = result.count;
    } catch (error) {
      errors.push({
        row: 0,
        email: "",
        error: error instanceof Error ? error.message : "Database error during import",
      });
    }
  }

  revalidatePath("/recipients");

  return {
    imported,
    skipped,
    failed: errors.length > 0 ? toCreate.length - imported : 0,
    errors,
  };
}

export async function deleteRecipient(id: string) {
  // Handle demo mode - simulate delete without database
  if (await isDemoMode()) {
    // Just revalidate path - the "deletion" is simulated
    revalidatePath("/recipients");
    return;
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.recipient.delete({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/recipients");
}
