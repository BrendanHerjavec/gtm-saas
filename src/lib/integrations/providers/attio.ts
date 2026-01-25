import crypto from "crypto";
import type {
  CRMAdapter,
  EntityType,
  FetchOptions,
  PaginatedRecords,
  ExternalRecord,
  OAuthTokens,
  WebhookRegistration,
  WebhookEvent,
} from "./types";

const ATTIO_API_BASE = "https://api.attio.com/v2";
const ATTIO_OAUTH_BASE = "https://app.attio.com/oauth";

// Attio object mapping (Attio uses "objects" terminology)
const ENTITY_TO_OBJECT: Record<EntityType, string> = {
  lead: "people", // Attio uses people for contacts/leads
  contact: "people",
  company: "companies",
  deal: "deals",
};

// Attio attribute slugs for each entity
const ENTITY_ATTRIBUTES: Record<EntityType, string[]> = {
  lead: [
    "email_addresses",
    "name",
    "phone_numbers",
    "job_title",
    "primary_location",
  ],
  contact: [
    "email_addresses",
    "name",
    "phone_numbers",
    "job_title",
    "primary_location",
    "linkedin",
  ],
  company: [
    "name",
    "domains",
    "description",
    "categories",
    "primary_location",
  ],
  deal: ["name", "value", "status", "close_date"],
};

// Map local fields to Attio attributes for updates
const LOCAL_TO_ATTIO: Record<EntityType, Record<string, string>> = {
  lead: {
    email: "email_addresses",
    firstName: "name",
    lastName: "name",
    phone: "phone_numbers",
    jobTitle: "job_title",
  },
  contact: {
    email: "email_addresses",
    firstName: "name",
    lastName: "name",
    phone: "phone_numbers",
    jobTitle: "job_title",
  },
  company: {
    name: "name",
    domain: "domains",
    description: "description",
  },
  deal: {
    name: "name",
    value: "value",
  },
};

export class AttioAdapter implements CRMAdapter {
  readonly provider = "attio" as const;

  private getClientId(): string {
    const clientId = process.env.ATTIO_CLIENT_ID;
    if (!clientId) throw new Error("ATTIO_CLIENT_ID is not configured");
    return clientId;
  }

  private getClientSecret(): string {
    const clientSecret = process.env.ATTIO_CLIENT_SECRET;
    if (!clientSecret) throw new Error("ATTIO_CLIENT_SECRET is not configured");
    return clientSecret;
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.getClientId(),
      redirect_uri: redirectUri,
      state,
      response_type: "code",
      scope: "record_permission:read record_permission:read_write user_management:read",
    });

    return `${ATTIO_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
    const response = await fetch(`${ATTIO_OAUTH_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${this.getClientId()}:${this.getClientSecret()}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Attio token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(`${ATTIO_OAUTH_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${this.getClientId()}:${this.getClientSecret()}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Attio token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async fetchRecords(
    entityType: EntityType,
    accessToken: string,
    options?: FetchOptions
  ): Promise<PaginatedRecords> {
    const objectSlug = ENTITY_TO_OBJECT[entityType];
    const limit = options?.limit || 100;
    const offset = options?.cursor ? parseInt(options.cursor, 10) : 0;

    const response = await fetch(
      `${ATTIO_API_BASE}/objects/${objectSlug}/records/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit,
          offset,
        }),
      }
    );

    if (!response.ok) {
      await this.handleError(response, "fetchRecords");
    }

    const data = await response.json();
    const records = data.data || [];

    return {
      records: records.map((r: Record<string, unknown>) =>
        this.normalizeRecord(r, entityType)
      ),
      nextCursor:
        records.length === limit ? String(offset + records.length) : null,
    };
  }

  async fetchRecordsModifiedSince(
    entityType: EntityType,
    accessToken: string,
    since: Date
  ): Promise<ExternalRecord[]> {
    const objectSlug = ENTITY_TO_OBJECT[entityType];

    // Attio uses filter for modified records
    const response = await fetch(
      `${ATTIO_API_BASE}/objects/${objectSlug}/records/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            updated_at: {
              $gte: since.toISOString(),
            },
          },
          limit: 500,
        }),
      }
    );

    if (!response.ok) {
      await this.handleError(response, "fetchRecordsModifiedSince");
    }

    const data = await response.json();
    return (data.data || []).map((r: Record<string, unknown>) =>
      this.normalizeRecord(r, entityType)
    );
  }

  async fetchRecord(
    entityType: EntityType,
    accessToken: string,
    externalId: string
  ): Promise<ExternalRecord | null> {
    const objectSlug = ENTITY_TO_OBJECT[entityType];

    const response = await fetch(
      `${ATTIO_API_BASE}/objects/${objectSlug}/records/${externalId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      await this.handleError(response, "fetchRecord");
    }

    const data = await response.json();
    return this.normalizeRecord(data.data, entityType);
  }

  async updateRecord(
    entityType: EntityType,
    accessToken: string,
    externalId: string,
    data: Record<string, unknown>
  ): Promise<ExternalRecord> {
    const objectSlug = ENTITY_TO_OBJECT[entityType];
    const fieldMapping = LOCAL_TO_ATTIO[entityType];

    // Map local field names to Attio attribute slugs
    const values: Record<string, unknown> = {};
    for (const [localField, value] of Object.entries(data)) {
      const attioField = fieldMapping[localField];
      if (attioField) {
        // Attio uses specific value formats for different attribute types
        if (attioField === "email_addresses" && typeof value === "string") {
          values[attioField] = [{ email_address: value }];
        } else if (attioField === "phone_numbers" && typeof value === "string") {
          values[attioField] = [{ phone_number: value }];
        } else if (attioField === "domains" && typeof value === "string") {
          values[attioField] = [{ domain: value }];
        } else {
          values[attioField] = value;
        }
      }
    }

    const response = await fetch(
      `${ATTIO_API_BASE}/objects/${objectSlug}/records/${externalId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: { values } }),
      }
    );

    if (!response.ok) {
      await this.handleError(response, "updateRecord");
    }

    const result = await response.json();
    return this.normalizeRecord(result.data, entityType);
  }

  async registerWebhook(
    accessToken: string,
    webhookUrl: string
  ): Promise<WebhookRegistration> {
    const secret = crypto.randomBytes(32).toString("hex");

    // Create webhook subscription
    const response = await fetch(`${ATTIO_API_BASE}/webhooks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_url: webhookUrl,
        subscriptions: [
          { event_type: "record.created", filter: { object_types: ["people", "companies", "deals"] } },
          { event_type: "record.updated", filter: { object_types: ["people", "companies", "deals"] } },
          { event_type: "record.deleted", filter: { object_types: ["people", "companies", "deals"] } },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Attio webhook registration failed:", error);
      // Return placeholder if webhook creation fails
      return { webhookId: "manual-setup-required", webhookSecret: secret };
    }

    const data = await response.json();

    return {
      webhookId: data.data?.id || "manual-setup-required",
      webhookSecret: secret,
    };
  }

  async deleteWebhook(accessToken: string, webhookId: string): Promise<void> {
    if (webhookId === "manual-setup-required") return;

    await fetch(`${ATTIO_API_BASE}/webhooks/${webhookId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  }

  parseWebhookPayload(payload: unknown): WebhookEvent[] {
    const data = payload as Record<string, unknown>;
    const events: WebhookEvent[] = [];

    const eventType = data.event_type as string;
    const record = data.record as Record<string, unknown>;

    if (!record) return events;

    const objectType = (record.object as Record<string, unknown>)?.slug as string;

    let entityType: EntityType = "contact";
    if (objectType === "companies") {
      entityType = "company";
    } else if (objectType === "deals") {
      entityType = "deal";
    }

    let action: "create" | "update" | "delete" = "update";
    if (eventType?.includes("created")) {
      action = "create";
    } else if (eventType?.includes("deleted")) {
      action = "delete";
    }

    events.push({
      entityType,
      action,
      externalId: record.id as string,
      timestamp: new Date(),
      data: this.normalizeRecord(record, entityType),
    });

    return events;
  }

  private normalizeRecord(
    record: Record<string, unknown>,
    entityType: EntityType
  ): ExternalRecord {
    const values = record.values as Record<string, unknown[]> || {};
    const properties: Record<string, unknown> = {};

    // Extract values from Attio's array-based value structure
    for (const [key, valueArray] of Object.entries(values)) {
      if (Array.isArray(valueArray) && valueArray.length > 0) {
        const firstValue = valueArray[0] as Record<string, unknown>;
        // Handle different value types
        if (firstValue.email_address) {
          properties[key] = firstValue.email_address;
        } else if (firstValue.phone_number) {
          properties[key] = firstValue.phone_number;
        } else if (firstValue.domain) {
          properties[key] = firstValue.domain;
        } else if (firstValue.value !== undefined) {
          properties[key] = firstValue.value;
        } else {
          properties[key] = firstValue;
        }
      }
    }

    return {
      id: (record.id as Record<string, unknown>)?.record_id as string || record.id as string,
      properties,
      createdAt: record.created_at as string,
      updatedAt: record.updated_at as string,
    };
  }

  private async handleError(
    response: Response,
    operation: string
  ): Promise<never> {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      errorMessage = await response.text();
    }

    throw new Error(
      `Attio ${operation} failed (${response.status}): ${errorMessage}`
    );
  }
}

export const attioAdapter = new AttioAdapter();
