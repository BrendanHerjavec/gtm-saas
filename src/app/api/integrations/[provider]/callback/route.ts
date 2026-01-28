import { NextRequest, NextResponse } from "next/server";
import {
  verifyOAuthState,
  getRedirectUri,
  storeIntegrationTokens,
} from "@/lib/integrations/oauth";
import {
  getProviderAdapter,
  isValidProvider,
} from "@/lib/integrations/providers";
import { runInitialSync } from "@/lib/integrations/sync";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  try {
    const { provider } = await params;

    // Handle OAuth errors from provider
    if (error) {
      console.error(`OAuth error from ${provider}:`, error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/integrations?error=${encodeURIComponent(errorDescription || error)}`,
          request.url
        )
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/integrations?error=missing_parameters`, request.url)
      );
    }

    // Validate provider
    if (!isValidProvider(provider)) {
      return NextResponse.redirect(
        new URL(`/integrations?error=invalid_provider`, request.url)
      );
    }

    // Verify state and extract organization context
    const stateData = verifyOAuthState(state);

    // Ensure state provider matches URL provider
    if (stateData.provider !== provider) {
      return NextResponse.redirect(
        new URL(`/integrations?error=provider_mismatch`, request.url)
      );
    }

    // Exchange code for tokens
    const adapter = getProviderAdapter(provider);
    const redirectUri = getRedirectUri(provider);
    const tokens = await adapter.exchangeCode(code, redirectUri);

    // Store tokens securely
    await storeIntegrationTokens(stateData.organizationId, provider, tokens);

    // Trigger initial sync in background (fire-and-forget)
    // Don't await - let the user be redirected while sync runs
    runInitialSync(stateData.organizationId).catch((syncError) => {
      console.error("Initial sync failed:", syncError);
    });

    // Redirect to integrations page with success
    return NextResponse.redirect(
      new URL(`/integrations?connected=${provider}`, request.url)
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/integrations?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Connection failed"
        )}`,
        request.url
      )
    );
  }
}
