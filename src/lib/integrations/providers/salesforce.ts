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

const SALESFORCE_AUTH_URL = "https://login.salesforce.com/services/oauth2";
const SALESFORCE_API_VERSION = "v59.0";

// Salesforce object mapping
const ENTITY_TO_SOBJECT: Record<EntityType, string> = {
  lead: "Lead",
  contact: "Contact",
  company: "Account",
  deal: "Opportunity",
};

// Fields to fetch for each entity type
const ENTITY_FIELDS: Record<EntityType, string[]> = {
  lead: [
    "Id",
    "Email",
    "FirstName",
    "LastName",
    "Phone",
    "Company",
    "Title",
    "LeadSource",
    "Status",
    "CreatedDate",
    "LastModifiedDate",
  ],
  contact: [
    "Id",
    "Email",
    "FirstName",
    "LastName",
    "Phone",
    "Title",
    "Department",
    "AccountId",
    "CreatedDate",
    "LastModifiedDate",
  ],
  company: [
    "Id",
    "Name",
    "Website",
    "Industry",
    "NumberOfEmployees",
    "AnnualRevenue",
    "Phone",
    "BillingStreet",
    "BillingCity",
    "BillingState",
    "BillingCountry",
    "Description",
    "CreatedDate",
    "LastModifiedDate",
  ],
  deal: [
    "Id",
    "Name",
    "Amount",
    "StageName",
    "Probability",
    "CloseDate",
    "IsClosed",
    "IsWon",
    "AccountId",
    "ContactId",
    "Description",
    "CreatedDate",
    "LastModifiedDate",
  ],
};

// Map local fields to Salesforce fields for updates
const LOCAL_TO_SALESFORCE: Record<EntityType, Record<string, string>> = {
  lead: {
    email: "Email",
    firstName: "FirstName",
    lastName: "LastName",
    phone: "Phone",
    company: "Company",
    jobTitle: "Title",
    status: "Status",
  },
  contact: {
    email: "Email",
    firstName: "FirstName",
    lastName: "LastName",
    phone: "Phone",
    jobTitle: "Title",
  },
  company: {
    name: "Name",
    website: "Website",
    industry: "Industry",
    phone: "Phone",
  },
  deal: {
    name: "Name",
    value: "Amount",
    notes: "Description",
  },
};

export class SalesforceAdapter implements CRMAdapter {
  readonly provider = "salesforce" as const;

  private getClientId(): string {
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    if (!clientId) throw new Error("SALESFORCE_CLIENT_ID is not configured");
    return clientId;
  }

  private getClientSecret(): string {
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    if (!clientSecret) throw new Error("SALESFORCE_CLIENT_SECRET is not configured");
    return clientSecret;
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.getClientId(),
      redirect_uri: redirectUri,
      state,
      scope: "api refresh_token offline_access",
    });

    return `${SALESFORCE_AUTH_URL}/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
    const response = await fetch(`${SALESFORCE_AUTH_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.getClientId(),
        client_secret: this.getClientSecret(),
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Salesforce token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      instanceUrl: data.instance_url,
      // Salesforce tokens don't have a fixed expiry, but refresh after ~2 hours
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(`${SALESFORCE_AUTH_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.getClientId(),
        client_secret: this.getClientSecret(),
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Salesforce token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Salesforce doesn't return a new refresh token
      instanceUrl: data.instance_url,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };
  }

  async fetchRecords(
    entityType: EntityType,
    accessToken: string,
    options?: FetchOptions,
    instanceUrl?: string
  ): Promise<PaginatedRecords> {
    if (!instanceUrl) {
      throw new Error("Salesforce instanceUrl is required");
    }

    const sobject = ENTITY_TO_SOBJECT[entityType];
    const fields = ENTITY_FIELDS[entityType];
    const limit = options?.limit || 200;

    let query = `SELECT ${fields.join(", ")} FROM ${sobject}`;

    if (options?.modifiedAfter) {
      query += ` WHERE LastModifiedDate > ${options.modifiedAfter.toISOString()}`;
    }

    query += ` ORDER BY LastModifiedDate DESC LIMIT ${limit}`;

    // Handle cursor-based pagination
    let url: string;
    if (options?.cursor) {
      url = `${instanceUrl}${options.cursor}`;
    } else {
      url = `${instanceUrl}/services/data/${SALESFORCE_API_VERSION}/query?q=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      await this.handleError(response, "fetchRecords");
    }

    const data = await response.json();

    return {
      records: data.records.map((r: Record<string, unknown>) =>
        this.normalizeRecord(r)
      ),
      nextCursor: data.nextRecordsUrl || null,
      total: data.totalSize,
    };
  }

  async fetchRecordsModifiedSince(
    entityType: EntityType,
    accessToken: string,
    since: Date,
    instanceUrl?: string
  ): Promise<ExternalRecord[]> {
    if (!instanceUrl) {
      throw new Error("Salesforce instanceUrl is required");
    }

    const sobject = ENTITY_TO_SOBJECT[entityType];
    const fields = ENTITY_FIELDS[entityType];

    const query = `SELECT ${fields.join(", ")} FROM ${sobject} WHERE LastModifiedDate > ${since.toISOString()} ORDER BY LastModifiedDate DESC`;

    const response = await fetch(
      `${instanceUrl}/services/data/${SALESFORCE_API_VERSION}/query?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      await this.handleError(response, "fetchRecordsModifiedSince");
    }

    const data = await response.json();
    return data.records.map((r: Record<string, unknown>) => this.normalizeRecord(r));
  }

  async fetchRecord(
    entityType: EntityType,
    accessToken: string,
    externalId: string,
    instanceUrl?: string
  ): Promise<ExternalRecord | null> {
    if (!instanceUrl) {
      throw new Error("Salesforce instanceUrl is required");
    }

    const sobject = ENTITY_TO_SOBJECT[entityType];
    const fields = ENTITY_FIELDS[entityType];

    const response = await fetch(
      `${instanceUrl}/services/data/${SALESFORCE_API_VERSION}/sobjects/${sobject}/${externalId}?fields=${fields.join(",")}`,
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
    return this.normalizeRecord(data);
  }

  async updateRecord(
    entityType: EntityType,
    accessToken: string,
    externalId: string,
    data: Record<string, unknown>,
    instanceUrl?: string
  ): Promise<ExternalRecord> {
    if (!instanceUrl) {
      throw new Error("Salesforce instanceUrl is required");
    }

    const sobject = ENTITY_TO_SOBJECT[entityType];
    const fieldMapping = LOCAL_TO_SALESFORCE[entityType];

    // Map local field names to Salesforce field names
    const updateData: Record<string, unknown> = {};
    for (const [localField, value] of Object.entries(data)) {
      const sfField = fieldMapping[localField];
      if (sfField) {
        updateData[sfField] = value;
      }
    }

    const response = await fetch(
      `${instanceUrl}/services/data/${SALESFORCE_API_VERSION}/sobjects/${sobject}/${externalId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );

    // Salesforce PATCH returns 204 No Content on success
    if (response.status !== 204 && !response.ok) {
      await this.handleError(response, "updateRecord");
    }

    // Fetch the updated record to return
    const updated = await this.fetchRecord(entityType, accessToken, externalId, instanceUrl);
    if (!updated) {
      throw new Error("Failed to fetch updated record");
    }
    return updated;
  }

  async registerWebhook(
    accessToken: string,
    webhookUrl: string,
    instanceUrl?: string
  ): Promise<WebhookRegistration> {
    // Salesforce uses Platform Events or Streaming API for real-time updates
    // These require more complex setup with PushTopics or Platform Events
    // For simplicity, return a placeholder - real implementation would use Streaming API
    const secret = crypto.randomBytes(32).toString("hex");

    return {
      webhookId: "configured-via-platform-events",
      webhookSecret: secret,
    };
  }

  async deleteWebhook(
    accessToken: string,
    webhookId: string,
    instanceUrl?: string
  ): Promise<void> {
    // Salesforce webhook/streaming cleanup would go here
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Salesforce Outbound Messages use X.509 certificates
    // For Platform Events, verification depends on the setup
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
    // Salesforce Platform Event structure
    const data = payload as Record<string, unknown>;
    const events: WebhookEvent[] = [];

    // Handle different event structures
    if (data.sobject) {
      const sobject = data.sobject as Record<string, unknown>;
      const objectType = sobject.type as string;

      let entityType: EntityType = "contact";
      if (objectType === "Account") {
        entityType = "company";
      } else if (objectType === "Opportunity") {
        entityType = "deal";
      } else if (objectType === "Lead") {
        entityType = "lead";
      }

      events.push({
        entityType,
        action: "update",
        externalId: sobject.Id as string,
        timestamp: new Date(),
      });
    }

    return events;
  }

  private normalizeRecord(record: Record<string, unknown>): ExternalRecord {
    // Salesforce returns flat objects with attributes
    const { attributes, Id, ...rest } = record;

    // Convert Salesforce field names to lowercase properties
    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      properties[key.toLowerCase()] = value;
    }

    return {
      id: Id as string,
      properties,
      createdAt: record.CreatedDate as string,
      updatedAt: record.LastModifiedDate as string,
    };
  }

  private async handleError(
    response: Response,
    operation: string
  ): Promise<never> {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData)) {
        errorMessage = errorData.map((e) => e.message).join(", ");
      } else {
        errorMessage = errorData.message || JSON.stringify(errorData);
      }
    } catch {
      errorMessage = await response.text();
    }

    throw new Error(
      `Salesforce ${operation} failed (${response.status}): ${errorMessage}`
    );
  }
}

export const salesforceAdapter = new SalesforceAdapter();
