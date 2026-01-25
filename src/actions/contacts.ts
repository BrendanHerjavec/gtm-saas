"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getContacts(params?: {
  search?: string;
  companyId?: string;
  page?: number;
  limit?: number;
}) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where = {
    organizationId: session.user.organizationId,
    ...(params?.companyId && { companyId: params.companyId }),
    ...(params?.search && {
      OR: [
        { email: { contains: params.search, mode: "insensitive" as const } },
        { firstName: { contains: params.search, mode: "insensitive" as const } },
        { lastName: { contains: params.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    contacts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getContact(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      company: true,
      deals: {
        include: {
          stage: true,
        },
      },
      activities: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  return contact;
}

export async function createContact(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  linkedinUrl?: string;
  companyId?: string;
}) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const contact = await prisma.contact.create({
    data: {
      ...data,
      organizationId: session.user.organizationId,
      ownerId: session.user.id,
    },
  });

  revalidatePath("/contacts");
  return contact;
}

export async function updateContact(
  id: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    linkedinUrl?: string;
    companyId?: string;
    ownerId?: string;
  }
) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const contact = await prisma.contact.updateMany({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    data,
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return contact;
}

export async function deleteContact(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.contact.deleteMany({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/contacts");
}
