import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "./encryption";
import { getProviderAdapter, type CRMProvider, type OAuthTokens } from "./providers";

const STATE_EXPIRY_MINUTES = 10;

interface OAuthState {
  organizationId: string;
  provider: CRMProvider;
  timestamp: number;
  nonce: string;
}

/**
 * Generate a secure state token for OAuth flow
 * Encodes organization ID and provider to maintain context through the redirect
 */
export function generateOAuthState(
  organizationId: string,
  provider: CRMProvider
): string {
  const state: OAuthState = {
    organizationId,
    provider,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
  };

  // Encode and sign the state
  const stateJson = JSON.stringify(state);
  const signature = crypto
    .createHmac("sha256", process.env.AUTH_SECRET || "fallback-secret")
    .update(stateJson)
    .digest("hex");

  return Buffer.from(`${stateJson}:${signature}`).toString("base64url");
}

/**
 * Verify and decode OAuth state token
 */
export function verifyOAuthState(stateToken: string): OAuthState {
  try {
    const decoded = Buffer.from(stateToken, "base64url").toString();
    const [stateJson, signature] = decoded.split(":");

    if (!stateJson || !signature) {
      throw new Error("Invalid state format");
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.AUTH_SECRET || "fallback-secret")
      .update(stateJson)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new Error("Invalid state signature");
    }

    const state: OAuthState = JSON.parse(stateJson);

    // Check expiry
    const ageMinutes = (Date.now() - state.timestamp) / 1000 / 60;
    if (ageMinutes > STATE_EXPIRY_MINUTES) {
      throw new Error("State token expired");
    }

    return state;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      throw error;
    }
    throw new Error("Invalid state token");
  }
}

/**
 * Get redirect URI for OAuth callback
 */
export function getRedirectUri(provider: CRMProvider): string {
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/api/integrations/${provider}/callback`;
}

/**
 * Store OAuth tokens securely in the database
 */
export async function storeIntegrationTokens(
  organizationId: string,
  provider: CRMProvider,
  tokens: OAuthTokens
): Promise<void> {
  const encryptedAccessToken = encrypt(tokens.accessToken);
  const encryptedRefreshToken = tokens.refreshToken
    ? encrypt(tokens.refreshToken)
    : null;

  await prisma.cRMIntegration.upsert({
    where: { organizationId },
    create: {
      organizationId,
      provider,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: tokens.expiresAt,
      instanceUrl: tokens.instanceUrl,
      status: "CONNECTED",
    },
    update: {
      provider,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: tokens.expiresAt,
      instanceUrl: tokens.instanceUrl,
      status: "CONNECTED",
      lastSyncError: null,
    },
  });
}

/**
 * Get a valid access token for an integration
 * Automatically refreshes if expired
 */
export async function getValidAccessToken(
  organizationId: string
): Promise<{ accessToken: string; instanceUrl?: string | null }> {
  const integration = await prisma.cRMIntegration.findUnique({
    where: { organizationId },
  });

  if (!integration) {
    throw new Error("No CRM integration found");
  }

  if (integration.status !== "CONNECTED") {
    throw new Error(`Integration is ${integration.status}`);
  }

  const now = new Date();
  const bufferMinutes = 5;
  const tokenExpiry = integration.tokenExpiresAt;

  // Check if token needs refresh
  if (
    tokenExpiry &&
    tokenExpiry < new Date(now.getTime() + bufferMinutes * 60 * 1000) &&
    integration.refreshToken
  ) {
    return await refreshIntegrationToken(integration.id);
  }

  return {
    accessToken: decrypt(integration.accessToken),
    instanceUrl: integration.instanceUrl,
  };
}

/**
 * Refresh an integration's access token
 */
async function refreshIntegrationToken(
  integrationId: string
): Promise<{ accessToken: string; instanceUrl?: string | null }> {
  const integration = await prisma.cRMIntegration.findUnique({
    where: { id: integrationId },
  });

  if (!integration || !integration.refreshToken) {
    throw new Error("Cannot refresh token");
  }

  const adapter = getProviderAdapter(integration.provider as CRMProvider);
  const decryptedRefreshToken = decrypt(integration.refreshToken);

  try {
    const newTokens = await adapter.refreshToken(decryptedRefreshToken);

    const encryptedAccessToken = encrypt(newTokens.accessToken);
    const encryptedRefreshToken = newTokens.refreshToken
      ? encrypt(newTokens.refreshToken)
      : integration.refreshToken;

    await prisma.cRMIntegration.update({
      where: { id: integrationId },
      data: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: newTokens.expiresAt,
        instanceUrl: newTokens.instanceUrl || integration.instanceUrl,
      },
    });

    return {
      accessToken: newTokens.accessToken,
      instanceUrl: newTokens.instanceUrl || integration.instanceUrl,
    };
  } catch (error) {
    // Mark integration as errored if refresh fails
    await prisma.cRMIntegration.update({
      where: { id: integrationId },
      data: {
        status: "ERROR",
        lastSyncError: `Token refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
    });
    throw error;
  }
}

/**
 * Get integration for an organization
 */
export async function getIntegration(organizationId: string) {
  return prisma.cRMIntegration.findUnique({
    where: { organizationId },
    include: {
      syncLogs: {
        orderBy: { startedAt: "desc" },
        take: 10,
      },
    },
  });
}

/**
 * Check if organization has an active CRM integration
 */
export async function hasActiveIntegration(
  organizationId: string
): Promise<boolean> {
  const integration = await prisma.cRMIntegration.findUnique({
    where: { organizationId },
    select: { status: true },
  });

  return integration?.status === "CONNECTED";
}
