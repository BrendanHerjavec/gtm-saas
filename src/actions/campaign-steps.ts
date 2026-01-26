"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type StepType = "EMAIL" | "GESTURE" | "DELAY";

export interface CampaignStepData {
  stepType: StepType;
  stepOrder: number;
  // Email fields
  emailSubject?: string;
  emailContent?: string;
  // Gesture fields
  gestureId?: string;
  gestureNote?: string;
  // Delay fields
  delayDays?: number;
  delayHours?: number;
}

export async function getCampaignSteps(campaignId: string) {
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

  return prisma.campaignStep.findMany({
    where: { campaignId },
    include: {
      gesture: true,
    },
    orderBy: { stepOrder: "asc" },
  });
}

export async function createCampaignStep(
  campaignId: string,
  data: CampaignStepData
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

  const step = await prisma.campaignStep.create({
    data: {
      campaignId,
      ...data,
    },
    include: {
      gesture: true,
    },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/edit`);
  return step;
}

export async function updateCampaignStep(
  stepId: string,
  data: Partial<CampaignStepData>
) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Verify user has access to this step's campaign
  const step = await prisma.campaignStep.findFirst({
    where: { id: stepId },
    include: { campaign: true },
  });

  if (!step || step.campaign.organizationId !== session.user.organizationId) {
    throw new Error("Step not found");
  }

  const updatedStep = await prisma.campaignStep.update({
    where: { id: stepId },
    data,
    include: {
      gesture: true,
    },
  });

  revalidatePath(`/campaigns/${step.campaignId}`);
  revalidatePath(`/campaigns/${step.campaignId}/edit`);
  return updatedStep;
}

export async function deleteCampaignStep(stepId: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Verify user has access to this step's campaign
  const step = await prisma.campaignStep.findFirst({
    where: { id: stepId },
    include: { campaign: true },
  });

  if (!step || step.campaign.organizationId !== session.user.organizationId) {
    throw new Error("Step not found");
  }

  await prisma.campaignStep.delete({
    where: { id: stepId },
  });

  // Reorder remaining steps
  const remainingSteps = await prisma.campaignStep.findMany({
    where: { campaignId: step.campaignId },
    orderBy: { stepOrder: "asc" },
  });

  for (let i = 0; i < remainingSteps.length; i++) {
    await prisma.campaignStep.update({
      where: { id: remainingSteps[i].id },
      data: { stepOrder: i + 1 },
    });
  }

  revalidatePath(`/campaigns/${step.campaignId}`);
  revalidatePath(`/campaigns/${step.campaignId}/edit`);
}

export async function reorderCampaignSteps(
  campaignId: string,
  stepIds: string[]
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

  // Update order for each step
  for (let i = 0; i < stepIds.length; i++) {
    await prisma.campaignStep.update({
      where: { id: stepIds[i] },
      data: { stepOrder: i + 1 },
    });
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/edit`);
}

// Get a campaign with its steps for the builder
export async function getCampaignWithSteps(campaignId: string) {
  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      organizationId: session.user.organizationId,
    },
    include: {
      steps: {
        include: {
          gesture: true,
        },
        orderBy: { stepOrder: "asc" },
      },
      recipients: {
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
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      stats: true,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return campaign;
}
