import type {
  ExternalRecord,
  MappedLead,
  MappedContact,
  MappedCompany,
  MappedDeal,
} from "../providers/types";

const HUBSPOT_BASE_URL = "https://app.hubspot.com";

/**
 * Map HubSpot contact to local Lead format
 */
export function mapHubSpotToLead(record: ExternalRecord): MappedLead {
  const props = record.properties;

  return {
    externalId: record.id,
    externalSource: "hubspot",
    externalUrl: `${HUBSPOT_BASE_URL}/contacts/${record.id}`,
    email: (props.email as string) || "",
    firstName: props.firstname as string | undefined,
    lastName: props.lastname as string | undefined,
    phone: props.phone as string | undefined,
    company: props.company as string | undefined,
    jobTitle: props.jobtitle as string | undefined,
    source: mapHubSpotLeadSource(props.hs_latest_source as string),
    status: mapHubSpotLeadStatus(props.hs_lead_status as string),
    lastSyncedAt: new Date(),
  };
}

/**
 * Map HubSpot contact to local Contact format
 */
export function mapHubSpotToContact(record: ExternalRecord): MappedContact {
  const props = record.properties;

  return {
    externalId: record.id,
    externalSource: "hubspot",
    externalUrl: `${HUBSPOT_BASE_URL}/contacts/${record.id}`,
    email: (props.email as string) || "",
    firstName: props.firstname as string | undefined,
    lastName: props.lastname as string | undefined,
    phone: props.phone as string | undefined,
    jobTitle: props.jobtitle as string | undefined,
    department: props.department as string | undefined,
    linkedinUrl: props.linkedin_url as string | undefined,
    externalCompanyId: props.associatedcompanyid as string | undefined,
    lastSyncedAt: new Date(),
  };
}

/**
 * Map HubSpot company to local Company format
 */
export function mapHubSpotToCompany(record: ExternalRecord): MappedCompany {
  const props = record.properties;

  return {
    externalId: record.id,
    externalSource: "hubspot",
    externalUrl: `${HUBSPOT_BASE_URL}/companies/${record.id}`,
    name: (props.name as string) || "",
    domain: props.domain as string | undefined,
    industry: props.industry as string | undefined,
    size: props.numberofemployees?.toString(),
    revenue: props.annualrevenue?.toString(),
    website: props.website as string | undefined,
    phone: props.phone as string | undefined,
    address: props.address as string | undefined,
    city: props.city as string | undefined,
    state: props.state as string | undefined,
    country: props.country as string | undefined,
    description: props.description as string | undefined,
    lastSyncedAt: new Date(),
  };
}

/**
 * Map HubSpot deal to local Deal format
 */
export function mapHubSpotToDeal(record: ExternalRecord): MappedDeal {
  const props = record.properties;

  return {
    externalId: record.id,
    externalSource: "hubspot",
    externalUrl: `${HUBSPOT_BASE_URL}/deals/${record.id}`,
    name: (props.dealname as string) || "",
    value: props.amount ? parseFloat(props.amount as string) : undefined,
    currency: "USD", // HubSpot stores in deal currency
    status: mapHubSpotDealStatus(props.hs_is_closed as string, props.hs_is_deal_lost as string),
    probability: props.hs_deal_stage_probability
      ? parseInt(props.hs_deal_stage_probability as string, 10)
      : undefined,
    expectedCloseDate: props.closedate
      ? new Date(props.closedate as string)
      : undefined,
    externalStageId: props.dealstage as string | undefined,
    stageName: props.dealstage as string | undefined,
    lastSyncedAt: new Date(),
  };
}

// Helper functions for status mapping
function mapHubSpotLeadSource(source: string | undefined): string {
  if (!source) return "OTHER";

  const sourceMap: Record<string, string> = {
    ORGANIC_SEARCH: "WEBSITE",
    PAID_SEARCH: "ADVERTISING",
    SOCIAL_MEDIA: "LINKEDIN",
    EMAIL_MARKETING: "OTHER",
    REFERRALS: "REFERRAL",
    OTHER_CAMPAIGNS: "OTHER",
    DIRECT_TRAFFIC: "WEBSITE",
    OFFLINE_SOURCES: "EVENT",
  };

  return sourceMap[source.toUpperCase()] || "OTHER";
}

function mapHubSpotLeadStatus(status: string | undefined): string {
  if (!status) return "NEW";

  const statusMap: Record<string, string> = {
    NEW: "NEW",
    OPEN: "NEW",
    IN_PROGRESS: "CONTACTED",
    OPEN_DEAL: "QUALIFIED",
    UNQUALIFIED: "UNQUALIFIED",
    ATTEMPTED_TO_CONTACT: "CONTACTED",
    CONNECTED: "CONTACTED",
    BAD_TIMING: "UNQUALIFIED",
  };

  return statusMap[status.toUpperCase()] || "NEW";
}

function mapHubSpotDealStatus(isClosed: string | undefined, isLost: string | undefined): string {
  if (isClosed === "true") {
    return isLost === "true" ? "LOST" : "WON";
  }
  return "OPEN";
}
