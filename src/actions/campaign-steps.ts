"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/demo-mode";
import { demoCampaigns } from "@/lib/demo-data";

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
  if (await isDemoMode()) {
    return [];
  }

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
  if (await isDemoMode()) {
    const mockStep = {
      id: `demo-step-${Date.now()}`,
      campaignId,
      stepType: data.stepType,
      stepOrder: data.stepOrder,
      emailSubject: data.emailSubject ?? null,
      emailContent: data.emailContent ?? null,
      gestureId: data.gestureId ?? null,
      gestureNote: data.gestureNote ?? null,
      delayDays: data.delayDays ?? null,
      delayHours: data.delayHours ?? null,
      isActive: true,
      gesture: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath(`/campaigns/${campaignId}/edit`);
    return mockStep;
  }

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
  if (await isDemoMode()) {
    const mockStep = {
      id: stepId,
      campaignId: "demo-campaign",
      stepType: data.stepType ?? "EMAIL",
      stepOrder: data.stepOrder ?? 1,
      emailSubject: data.emailSubject ?? null,
      emailContent: data.emailContent ?? null,
      gestureId: data.gestureId ?? null,
      gestureNote: data.gestureNote ?? null,
      delayDays: data.delayDays ?? null,
      delayHours: data.delayHours ?? null,
      isActive: true,
      gesture: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    revalidatePath("/campaigns");
    return mockStep;
  }

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
  if (await isDemoMode()) {
    revalidatePath("/campaigns");
    return;
  }

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

  // Reorder remaining steps in a single transaction
  const remainingSteps = await prisma.campaignStep.findMany({
    where: { campaignId: step.campaignId },
    orderBy: { stepOrder: "asc" },
  });

  if (remainingSteps.length > 0) {
    await prisma.$transaction(
      remainingSteps.map((s, i) =>
        prisma.campaignStep.update({
          where: { id: s.id },
          data: { stepOrder: i + 1 },
        })
      )
    );
  }

  revalidatePath(`/campaigns/${step.campaignId}`);
  revalidatePath(`/campaigns/${step.campaignId}/edit`);
}

export async function reorderCampaignSteps(
  campaignId: string,
  stepIds: string[]
) {
  if (await isDemoMode()) {
    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath(`/campaigns/${campaignId}/edit`);
    return;
  }

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

  // Update order for all steps in a single transaction
  await prisma.$transaction(
    stepIds.map((id, i) =>
      prisma.campaignStep.update({
        where: { id },
        data: { stepOrder: i + 1 },
      })
    )
  );

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/edit`);
}

// Get a campaign with its steps for the builder
export async function getCampaignWithSteps(campaignId: string) {
  if (await isDemoMode()) {
    // Check if this is a demo campaign (existing or newly created)
    const demoCampaign = demoCampaigns.find((c) => c.id === campaignId);

    // For newly created demo campaigns (id starts with "demo-campaign-"), return a shell
    const name = demoCampaign?.name || "New Campaign";
    const description = demoCampaign?.description || null;

    return {
      id: campaignId,
      name,
      description,
      subject: null,
      content: null,
      status: "DRAFT",
      type: "SEQUENCE",
      budgetAmount: 0,
      budgetSpent: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      organizationId: "demo-org-id",
      createdById: "demo-user-id",
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: [],
      recipients: [],
      createdBy: { id: "demo-user-id", name: "Demo User", email: "demo@example.com" },
      stats: null,
    };
  }

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
