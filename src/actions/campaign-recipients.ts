"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCampaignRecipients(campaignId: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return [];
  }

  // Verify user has access to this campaign
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      organizationId: session.user.organizationId,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return prisma.campaignRecipient.findMany({
    where: { campaignId },
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
    orderBy: { addedAt: "desc" },
  });
}

export async function addRecipientsToCampaign(
  campaignId: string,
  recipientIds: string[]
) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Verify user has access to this campaign
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      organizationId: session.user.organizationId,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Verify all recipients belong to the organization
  const recipients = await prisma.recipient.findMany({
    where: {
      id: { in: recipientIds },
      organizationId: session.user.organizationId,
      doNotSend: false, // Don't add recipients who opted out
    },
    select: { id: true },
  });

  const validRecipientIds = recipients.map((r) => r.id);

  // Create campaign recipients (skip duplicates with upsert behavior)
  const results = await Promise.all(
    validRecipientIds.map((recipientId) =>
      prisma.campaignRecipient.upsert({
        where: {
          campaignId_recipientId: {
            campaignId,
            recipientId,
          },
        },
        create: {
          campaignId,
          recipientId,
        },
        update: {}, // No update needed if already exists
      })
    )
  );

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/edit`);

  return {
    added: results.length,
    skipped: recipientIds.length - validRecipientIds.length,
  };
}

export async function removeRecipientFromCampaign(
  campaignId: string,
  recipientId: string
) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Verify user has access to this campaign
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      organizationId: session.user.organizationId,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  await prisma.campaignRecipient.delete({
    where: {
      campaignId_recipientId: {
        campaignId,
        recipientId,
      },
    },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/edit`);
}

export async function removeAllRecipientsFromCampaign(campaignId: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Verify user has access to this campaign
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      organizationId: session.user.organizationId,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  await prisma.campaignRecipient.deleteMany({
    where: { campaignId },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/edit`);
}

// Get available recipients (not yet in the campaign)
export async function getAvailableRecipients(
  campaignId: string,
  search?: string
) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return [];
  }

  // Get recipients already in the campaign
  const existingRecipientIds = await prisma.campaignRecipient.findMany({
    where: { campaignId },
    select: { recipientId: true },
  });

  const excludeIds = existingRecipientIds.map((r) => r.recipientId);

  const where: any = {
    organizationId: session.user.organizationId,
    doNotSend: false,
    id: { notIn: excludeIds },
  };

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.recipient.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      company: true,
      jobTitle: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 50,
  });
}
