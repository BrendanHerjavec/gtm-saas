import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  try {
    // Step 1: Check auth session
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No session", step: "auth" });
    }
    if (!session.user.organizationId) {
      return NextResponse.json({
        error: "No organizationId",
        step: "auth",
        userId: session.user.id,
        userName: session.user.name,
      });
    }

    // Step 2: Try to count campaigns
    let campaignCount: number;
    try {
      campaignCount = await prisma.campaign.count({
        where: { organizationId: session.user.organizationId },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: msg, step: "campaign_count" });
    }

    // Step 3: Try to create a test campaign
    let campaign;
    try {
      campaign = await prisma.campaign.create({
        data: {
          name: "Debug Test Campaign",
          type: "MANUAL",
          organizationId: session.user.organizationId,
          createdById: session.user.id,
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: msg, step: "campaign_create" });
    }

    // Step 4: Try to create campaign stats
    try {
      await prisma.campaignStats.create({
        data: { campaignId: campaign.id },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // Clean up the campaign we just created
      await prisma.campaign.delete({ where: { id: campaign.id } }).catch(() => {});
      return NextResponse.json({ error: msg, step: "stats_create", campaignId: campaign.id });
    }

    // Step 5: Clean up - delete test campaign and stats
    await prisma.campaignStats.deleteMany({ where: { campaignId: campaign.id } }).catch(() => {});
    await prisma.campaign.delete({ where: { id: campaign.id } }).catch(() => {});

    return NextResponse.json({
      success: true,
      campaignCount,
      userId: session.user.id,
      organizationId: session.user.organizationId,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, step: "unknown" });
  }
}
