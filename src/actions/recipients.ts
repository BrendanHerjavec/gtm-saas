"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export type RecipientStatus = "all" | "active" | "do_not_send";

export interface GetRecipientsParams {
  status?: RecipientStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getRecipients(params: GetRecipientsParams = {}) {
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

export async function deleteRecipient(id: string) {
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
