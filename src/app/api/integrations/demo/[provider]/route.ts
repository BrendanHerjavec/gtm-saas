import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { isValidProvider, type CRMProvider } from "@/lib/integrations/providers";
import { createDemoIntegration, isDemoMode } from "@/lib/integrations/demo";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    // Check if demo mode is enabled
    if (!isDemoMode()) {
      return NextResponse.json(
        { error: "Demo mode is not enabled" },
        { status: 403 }
      );
    }

    const { provider } = await params;

    // Validate provider
    if (!isValidProvider(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getAuthSession();
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create demo integration
    await createDemoIntegration(
      session.user.organizationId,
      provider as CRMProvider
    );

    return NextResponse.json({
      success: true,
      message: `Demo ${provider} integration created successfully`,
    });
  } catch (error) {
    console.error("Demo integration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create demo integration" },
      { status: 500 }
    );
  }
}
