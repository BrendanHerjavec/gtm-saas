import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" });
    }

    // Check current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" });
    }

    if (user.organizationId && user.organization) {
      return NextResponse.json({
        message: "User already has organization",
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      });
    }

    // Create organization for user
    const org = await prisma.organization.create({
      data: {
        name: `${user.name || "User"}'s Organization`,
        slug: `org-${user.id.substring(0, 8)}`,
      },
    });

    // Link user to organization and set as admin
    await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: org.id,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Organization created and linked",
      organizationId: org.id,
      organizationName: org.name,
      userId: user.id,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg });
  }
}
