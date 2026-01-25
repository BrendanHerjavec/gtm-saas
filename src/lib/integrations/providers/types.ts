// CRM Provider Types

export type CRMProvider = "hubspot" | "salesforce" | "attio";

export type EntityType = "lead" | "contact" | "company" | "deal";

// OAuth Types
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  instanceUrl?: string; // For Salesforce
  scope?: string;
}

export interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
}

// Fetch Options
export interface FetchOptions {
  cursor?: string | null;
  limit?: number;
  modifiedAfter?: Date;
}

export interface PaginatedRecords<T = ExternalRecord> {
  records: T[];
  nextCursor: string | null;
  total?: number;
}

// External Record from CRM (raw format before mapping)
export interface ExternalRecord {
  id: string;
  properties: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

// Mapped Records (normalized format for local storage)
export interface MappedLead {
  externalId: string;
  externalSource: CRMProvider;
  externalUrl: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  status?: string;
  lastSyncedAt: Date;
}

export interface MappedContact {
  externalId: string;
  externalSource: CRMProvider;
  externalUrl: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  linkedinUrl?: string;
  lastSyncedAt: Date;
  // For linking to company
  externalCompanyId?: string;
}

export interface MappedCompany {
  externalId: string;
  externalSource: CRMProvider;
  externalUrl: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  revenue?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  lastSyncedAt: Date;
}

export interface MappedDeal {
  externalId: string;
  externalSource: CRMProvider;
  externalUrl: string;
  name: string;
  value?: number;
  currency?: string;
  status?: string;
  probability?: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  notes?: string;
  lastSyncedAt: Date;
  // For linking
  externalContactId?: string;
  externalCompanyId?: string;
  externalStageId?: string;
  stageName?: string;
}

export type MappedRecord = MappedLead | MappedContact | MappedCompany | MappedDeal;

// Webhook Types
export interface WebhookRegistration {
  webhookId: string;
  webhookSecret?: string;
}

export interface WebhookEvent {
  entityType: EntityType;
  action: "create" | "update" | "delete";
  externalId: string;
  data?: ExternalRecord;
  timestamp: Date;
}

// Writable fields (what can be pushed back to CRM)
export interface WritableLeadFields {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: string;
}

export interface WritableContactFields {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
}

export interface WritableCompanyFields {
  name?: string;
  domain?: string;
  industry?: string;
  website?: string;
  phone?: string;
}

export interface WritableDealFields {
  name?: string;
  value?: number;
  status?: string;
  notes?: string;
}

// CRM Adapter Interface
export interface CRMAdapter {
  readonly provider: CRMProvider;

  // OAuth
  getAuthUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshToken(refreshToken: string): Promise<OAuthTokens>;

  // Data Read Operations
  fetchRecords(
    entityType: EntityType,
    accessToken: string,
    options?: FetchOptions,
    instanceUrl?: string
  ): Promise<PaginatedRecords>;

  fetchRecordsModifiedSince(
    entityType: EntityType,
    accessToken: string,
    since: Date,
    instanceUrl?: string
  ): Promise<ExternalRecord[]>;

  fetchRecord(
    entityType: EntityType,
    accessToken: string,
    externalId: string,
    instanceUrl?: string
  ): Promise<ExternalRecord | null>;

  // Data Write Operations (limited fields only)
  updateRecord(
    entityType: EntityType,
    accessToken: string,
    externalId: string,
    data: Record<string, unknown>,
    instanceUrl?: string
  ): Promise<ExternalRecord>;

  // Webhooks
  registerWebhook(
    accessToken: string,
    webhookUrl: string,
    instanceUrl?: string
  ): Promise<WebhookRegistration>;

  deleteWebhook(
    accessToken: string,
    webhookId: string,
    instanceUrl?: string
  ): Promise<void>;

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean;

  parseWebhookPayload(payload: unknown): WebhookEvent[];
}

// Field Mapping Configuration
export interface FieldMapping {
  localField: string;
  externalField: string;
  transform?: (value: unknown) => unknown;
}

export interface EntityFieldMappings {
  lead: FieldMapping[];
  contact: FieldMapping[];
  company: FieldMapping[];
  deal: FieldMapping[];
}
