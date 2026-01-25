import type {
  ExternalRecord,
  MappedLead,
  MappedContact,
  MappedCompany,
  MappedDeal,
} from "../providers/types";

/**
 * Map Salesforce Lead to local Lead format
 */
export function mapSalesforceToLead(
  record: ExternalRecord,
  instanceUrl: string
): MappedLead {
  const props = record.properties;

  return {
    externalId: record.id,
    externalSource: "salesforce",
    externalUrl: `${instanceUrl}/${record.id}`,
    email: (props.email as string) || "",
    firstName: props.firstname as string | undefined,
    lastName: props.lastname as string | undefined,
    phone: props.phone as string | undefined,
    company: props.company as string | undefined,
    jobTitle: props.title as string | undefined,
    source: mapSalesforceLeadSource(props.leadsource as string),
    status: mapSalesforceLeadStatus(props.status as string),
    lastSyncedAt: new Date(),
  };
}

/**
 * Map Salesforce Contact to local Contact format
 */
export function mapSalesforceToContact(
  record: ExternalRecord,
  instanceUrl: string
): MappedContact {
  const props = record.properties;

  return {
    externalId: record.id,
    externalSource: "salesforce",
    externalUrl: `${instanceUrl}/${record.id}`,
    email: (props.email as string) || "",
    firstName: props.firstname as string | undefined,
    lastName: props.lastname as string | undefined,
    phone: props.phone as string | undefined,
    jobTitle: props.title as string | undefined,
    department: props.department as string | undefined,
    externalCompanyId: props.accountid as string | undefined,
    lastSyncedAt: new Date(),
  };
}

/**
 * Map Salesforce Account to local Company format
 */
export function mapSalesforceToCompany(
  record: ExternalRecord,
  instanceUrl: string
): MappedCompany {
  const props = record.properties;

  return {
    externalId: record.id,
    externalSource: "salesforce",
    externalUrl: `${instanceUrl}/${record.id}`,
    name: (props.name as string) || "",
    website: props.website as string | undefined,
    industry: props.industry as string | undefined,
    size: props.numberofemployees?.toString(),
    revenue: props.annualrevenue?.toString(),
    phone: props.phone as string | undefined,
    address: props.billingstreet as string | undefined,
    city: props.billingcity as string | undefined,
    state: props.billingstate as string | undefined,
    country: props.billingcountry as string | undefined,
    description: props.description as string | undefined,
    lastSyncedAt: new Date(),
  };
}

/**
 * Map Salesforce Opportunity to local Deal format
 */
export function mapSalesforceToDeal(
  record: ExternalRecord,
  instanceUrl: string
): MappedDeal {
  const props = record.properties;

  return {
    externalId: record.id,
    externalSource: "salesforce",
    externalUrl: `${instanceUrl}/${record.id}`,
    name: (props.name as string) || "",
    value: props.amount ? parseFloat(props.amount as string) : undefined,
    currency: "USD",
    status: mapSalesforceDealStatus(
      props.isclosed as boolean,
      props.iswon as boolean
    ),
    probability: props.probability
      ? parseInt(props.probability as string, 10)
      : undefined,
    expectedCloseDate: props.closedate
      ? new Date(props.closedate as string)
      : undefined,
    notes: props.description as string | undefined,
    externalContactId: props.contactid as string | undefined,
    externalCompanyId: props.accountid as string | undefined,
    stageName: props.stagename as string | undefined,
    lastSyncedAt: new Date(),
  };
}

// Helper functions for status mapping
function mapSalesforceLeadSource(source: string | undefined): string {
  if (!source) return "OTHER";

  const sourceMap: Record<string, string> = {
    Web: "WEBSITE",
    "Phone Inquiry": "COLD_OUTREACH",
    "Partner Referral": "REFERRAL",
    "Purchased List": "OTHER",
    Other: "OTHER",
    Advertisement: "ADVERTISING",
    "Employee Referral": "REFERRAL",
    "External Referral": "REFERRAL",
    Public_Relations: "OTHER",
    "Trade Show": "EVENT",
    Word_of_mouth: "REFERRAL",
    "Social Media": "LINKEDIN",
  };

  return sourceMap[source] || "OTHER";
}

function mapSalesforceLeadStatus(status: string | undefined): string {
  if (!status) return "NEW";

  const statusMap: Record<string, string> = {
    "Open - Not Contacted": "NEW",
    "Working - Contacted": "CONTACTED",
    "Closed - Converted": "CONVERTED",
    "Closed - Not Converted": "UNQUALIFIED",
    New: "NEW",
    Contacted: "CONTACTED",
    Qualified: "QUALIFIED",
    Unqualified: "UNQUALIFIED",
  };

  return statusMap[status] || "NEW";
}

function mapSalesforceDealStatus(
  isClosed: boolean | undefined,
  isWon: boolean | undefined
): string {
  if (isClosed) {
    return isWon ? "WON" : "LOST";
  }
  return "OPEN";
}
