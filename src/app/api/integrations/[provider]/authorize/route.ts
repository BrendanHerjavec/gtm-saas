import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import {
  generateOAuthState,
  getRedirectUri,
} from "@/lib/integrations/oauth";
import {
  getProviderAdapter,
  isValidProvider,
} from "@/lib/integrations/providers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;

    // Validate provider
    if (!isValidProvider(provider)) {
      return NextResponse.redirect(
        new URL(`/integrations?error=invalid_provider`, request.url)
      );
    }

    // Check authentication
    const session = await getAuthSession();
    if (!session?.user?.organizationId) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=/integrations`, request.url)
      );
    }

    // Generate state token with organization context
    const state = generateOAuthState(session.user.organizationId, provider);
    const redirectUri = getRedirectUri(provider);

    // Get provider adapter and auth URL
    const adapter = getProviderAdapter(provider);
    const authUrl = adapter.getAuthUrl(state, redirectUri);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("OAuth authorize error:", error);
    return NextResponse.redirect(
      new URL(
        `/integrations?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        request.url
      )
    );
  }
}
