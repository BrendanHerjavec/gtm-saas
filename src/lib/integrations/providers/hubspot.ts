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

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const HUBSPOT_OAUTH_BASE = "https://app.hubspot.com/oauth";

// HubSpot object type mapping
const ENTITY_TO_OBJECT: Record<EntityType, string> = {
  lead: "contacts", // HubSpot doesn't have separate leads, uses contacts
  contact: "contacts",
  company: "companies",
  deal: "deals",
};

// Properties to fetch for each entity type
const ENTITY_PROPERTIES: Record<EntityType, string[]> = {
  lead: [
    "email",
    "firstname",
    "lastname",
    "phone",
    "company",
    "jobtitle",
    "lifecyclestage",
    "hs_lead_status",
    "createdate",
    "lastmodifieddate",
  ],
  contact: [
    "email",
    "firstname",
    "lastname",
    "phone",
    "jobtitle",
    "department",
    "linkedin_url",
    "associatedcompanyid",
    "createdate",
    "lastmodifieddate",
  ],
  company: [
    "name",
    "domain",
    "industry",
    "numberofemployees",
    "annualrevenue",
    "website",
    "phone",
    "address",
    "city",
    "state",
    "country",
    "description",
    "createdate",
    "lastmodifieddate",
  ],
  deal: [
    "dealname",
    "amount",
    "dealstage",
    "pipeline",
    "closedate",
    "hs_deal_stage_probability",
    "notes_last_updated",
    "createdate",
    "lastmodifieddate",
  ],
};

// Map local fields to HubSpot properties for updates
const LOCAL_TO_HUBSPOT: Record<EntityType, Record<string, string>> = {
  lead: {
    email: "email",
    firstName: "firstname",
    lastName: "lastname",
    phone: "phone",
    company: "company",
    jobTitle: "jobtitle",
    status: "hs_lead_status",
  },
  contact: {
    email: "email",
    firstName: "firstname",
    lastName: "lastname",
    phone: "phone",
    jobTitle: "jobtitle",
  },
  company: {
    name: "name",
    domain: "domain",
    industry: "industry",
    website: "website",
    phone: "phone",
  },
  deal: {
    name: "dealname",
    value: "amount",
    notes: "description",
  },
};

export class HubSpotAdapter implements CRMAdapter {
  readonly provider = "hubspot" as const;

  private getClientId(): string {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    if (!clientId) throw new Error("HUBSPOT_CLIENT_ID is not configured");
    return clientId;
  }

  private getClientSecret(): string {
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    if (!clientSecret) throw new Error("HUBSPOT_CLIENT_SECRET is not configured");
    return clientSecret;
  }

  getAuthUrl(state: string, redirectUri: string): string {
    const scopes = [
      "crm.objects.contacts.read",
      "crm.objects.contacts.write",
      "crm.objects.companies.read",
      "crm.objects.companies.write",
      "crm.objects.deals.read",
      "crm.objects.deals.write",
    ];

    const params = new URLSearchParams({
      client_id: this.getClientId(),
      redirect_uri: redirectUri,
      scope: scopes.join(" "),
      state,
    });

    return `${HUBSPOT_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
    const response = await fetch(`${HUBSPOT_API_BASE}/oauth/v1/token`, {
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
      throw new Error(`HubSpot token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(`${HUBSPOT_API_BASE}/oauth/v1/token`, {
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
      throw new Error(`HubSpot token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async fetchRecords(
    entityType: EntityType,
    accessToken: string,
    options?: FetchOptions
  ): Promise<PaginatedRecords> {
    const objectType = ENTITY_TO_OBJECT[entityType];
    const properties = ENTITY_PROPERTIES[entityType];

    const url = new URL(`${HUBSPOT_API_BASE}/crm/v3/objects/${objectType}`);
    url.searchParams.set("limit", String(options?.limit || 100));
    url.searchParams.set("properties", properties.join(","));

    if (options?.cursor) {
      url.searchParams.set("after", options.cursor);
    }

    const response = await fetch(url.toString(), {
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
      records: data.results.map((r: Record<string, unknown>) =>
        this.normalizeRecord(r)
      ),
      nextCursor: data.paging?.next?.after || null,
      total: data.total,
    };
  }

  async fetchRecordsModifiedSince(
    entityType: EntityType,
    accessToken: string,
    since: Date
  ): Promise<ExternalRecord[]> {
    const objectType = ENTITY_TO_OBJECT[entityType];
    const properties = ENTITY_PROPERTIES[entityType];

    // Use search endpoint with filter for modified date
    const response = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/${objectType}/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "lastmodifieddate",
                  operator: "GTE",
                  value: since.getTime(),
                },
              ],
            },
          ],
          properties,
          limit: 100,
        }),
      }
    );

    if (!response.ok) {
      await this.handleError(response, "fetchRecordsModifiedSince");
    }

    const data = await response.json();
    return data.results.map((r: Record<string, unknown>) => this.normalizeRecord(r));
  }

  async fetchRecord(
    entityType: EntityType,
    accessToken: string,
    externalId: string
  ): Promise<ExternalRecord | null> {
    const objectType = ENTITY_TO_OBJECT[entityType];
    const properties = ENTITY_PROPERTIES[entityType];

    const url = new URL(
      `${HUBSPOT_API_BASE}/crm/v3/objects/${objectType}/${externalId}`
    );
    url.searchParams.set("properties", properties.join(","));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

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
    data: Record<string, unknown>
  ): Promise<ExternalRecord> {
    const objectType = ENTITY_TO_OBJECT[entityType];
    const fieldMapping = LOCAL_TO_HUBSPOT[entityType];

    // Map local field names to HubSpot property names
    const properties: Record<string, unknown> = {};
    for (const [localField, value] of Object.entries(data)) {
      const hubspotField = fieldMapping[localField];
      if (hubspotField) {
        properties[hubspotField] = value;
      }
    }

    const response = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/${objectType}/${externalId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties }),
      }
    );

    if (!response.ok) {
      await this.handleError(response, "updateRecord");
    }

    const result = await response.json();
    return this.normalizeRecord(result);
  }

  async registerWebhook(
    accessToken: string,
    webhookUrl: string
  ): Promise<WebhookRegistration> {
    // HubSpot webhooks are configured via the app settings in the developer portal
    // This method would typically be used if using the API to configure webhooks
    // For now, return a placeholder - webhook configuration is done in HubSpot's UI
    const secret = crypto.randomBytes(32).toString("hex");

    return {
      webhookId: "configured-in-hubspot-portal",
      webhookSecret: secret,
    };
  }

  async deleteWebhook(accessToken: string, webhookId: string): Promise<void> {
    // HubSpot webhook deletion is done via the developer portal
    // This is a no-op for the API-based approach
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // HubSpot v3 signature verification
    // Signature format: sha256=<hash>
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const providedHash = signature.replace("sha256=", "");
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedHash)
    );
  }

  parseWebhookPayload(payload: unknown): WebhookEvent[] {
    // HubSpot sends an array of events
    const events = Array.isArray(payload) ? payload : [payload];

    return events.map((event: Record<string, unknown>) => {
      const subscriptionType = event.subscriptionType as string;
      const objectType = (event.objectType as string)?.toLowerCase();

      // Map HubSpot object types to our entity types
      let entityType: EntityType = "contact";
      if (objectType === "company" || objectType === "companies") {
        entityType = "company";
      } else if (objectType === "deal" || objectType === "deals") {
        entityType = "deal";
      }

      // Map subscription type to action
      let action: "create" | "update" | "delete" = "update";
      if (subscriptionType?.includes("creation")) {
        action = "create";
      } else if (subscriptionType?.includes("deletion")) {
        action = "delete";
      }

      return {
        entityType,
        action,
        externalId: String(event.objectId),
        timestamp: new Date(event.occurredAt as number),
      };
    });
  }

  private normalizeRecord(record: Record<string, unknown>): ExternalRecord {
    return {
      id: String(record.id),
      properties: (record.properties as Record<string, unknown>) || {},
      createdAt: record.createdAt as string,
      updatedAt: record.updatedAt as string,
    };
  }

  private async handleError(
    response: Response,
    operation: string
  ): Promise<never> {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || JSON.stringify(errorData);
    } catch {
      errorMessage = await response.text();
    }

    throw new Error(
      `HubSpot ${operation} failed (${response.status}): ${errorMessage}`
    );
  }
}

export const hubspotAdapter = new HubSpotAdapter();
