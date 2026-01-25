import type {
  ExternalRecord,
  MappedLead,
  MappedContact,
  MappedCompany,
  MappedDeal,
} from "../providers/types";

const ATTIO_BASE_URL = "https://app.attio.com";

/**
 * Map Attio person to local Lead format
 */
export function mapAttioToLead(record: ExternalRecord): MappedLead {
  const props = record.properties;

  // Attio uses structured name object
  const name = parseName(props.name);

  return {
    externalId: record.id,
    externalSource: "attio",
    externalUrl: `${ATTIO_BASE_URL}/people/${record.id}`,
    email: extractEmail(props.email_addresses),
    firstName: name.firstName,
    lastName: name.lastName,
    phone: extractPhone(props.phone_numbers),
    jobTitle: props.job_title as string | undefined,
    source: "OTHER", // Attio doesn't have standard source field
    status: "NEW",
    lastSyncedAt: new Date(),
  };
}

/**
 * Map Attio person to local Contact format
 */
export function mapAttioToContact(record: ExternalRecord): MappedContact {
  const props = record.properties;
  const name = parseName(props.name);

  return {
    externalId: record.id,
    externalSource: "attio",
    externalUrl: `${ATTIO_BASE_URL}/people/${record.id}`,
    email: extractEmail(props.email_addresses),
    firstName: name.firstName,
    lastName: name.lastName,
    phone: extractPhone(props.phone_numbers),
    jobTitle: props.job_title as string | undefined,
    linkedinUrl: props.linkedin as string | undefined,
    lastSyncedAt: new Date(),
  };
}

/**
 * Map Attio company to local Company format
 */
export function mapAttioToCompany(record: ExternalRecord): MappedCompany {
  const props = record.properties;
  const location = parseLocation(props.primary_location);

  return {
    externalId: record.id,
    externalSource: "attio",
    externalUrl: `${ATTIO_BASE_URL}/companies/${record.id}`,
    name: (props.name as string) || "",
    domain: extractDomain(props.domains),
    industry: extractCategory(props.categories),
    description: props.description as string | undefined,
    city: location.city,
    state: location.state,
    country: location.country,
    lastSyncedAt: new Date(),
  };
}

/**
 * Map Attio deal to local Deal format
 */
export function mapAttioToDeal(record: ExternalRecord): MappedDeal {
  const props = record.properties;

  return {
    externalId: record.id,
    externalSource: "attio",
    externalUrl: `${ATTIO_BASE_URL}/deals/${record.id}`,
    name: (props.name as string) || "",
    value: props.value ? parseFloat(props.value as string) : undefined,
    status: mapAttioStatus(props.status as string),
    expectedCloseDate: props.close_date
      ? new Date(props.close_date as string)
      : undefined,
    lastSyncedAt: new Date(),
  };
}

// Helper functions

function parseName(
  name: unknown
): { firstName?: string; lastName?: string } {
  if (typeof name === "string") {
    const parts = name.split(" ");
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" ") || undefined,
    };
  }
  if (typeof name === "object" && name !== null) {
    const nameObj = name as Record<string, unknown>;
    return {
      firstName: nameObj.first_name as string | undefined,
      lastName: nameObj.last_name as string | undefined,
    };
  }
  return {};
}

function extractEmail(emails: unknown): string {
  if (Array.isArray(emails) && emails.length > 0) {
    const first = emails[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null) {
      return (first as Record<string, unknown>).email_address as string || "";
    }
  }
  if (typeof emails === "string") return emails;
  return "";
}

function extractPhone(phones: unknown): string | undefined {
  if (Array.isArray(phones) && phones.length > 0) {
    const first = phones[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null) {
      return (first as Record<string, unknown>).phone_number as string;
    }
  }
  if (typeof phones === "string") return phones;
  return undefined;
}

function extractDomain(domains: unknown): string | undefined {
  if (Array.isArray(domains) && domains.length > 0) {
    const first = domains[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null) {
      return (first as Record<string, unknown>).domain as string;
    }
  }
  if (typeof domains === "string") return domains;
  return undefined;
}

function extractCategory(categories: unknown): string | undefined {
  if (Array.isArray(categories) && categories.length > 0) {
    const first = categories[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null) {
      return (first as Record<string, unknown>).name as string;
    }
  }
  return undefined;
}

function parseLocation(
  location: unknown
): { city?: string; state?: string; country?: string } {
  if (typeof location === "object" && location !== null) {
    const loc = location as Record<string, unknown>;
    return {
      city: loc.city as string | undefined,
      state: loc.state as string | undefined,
      country: loc.country as string | undefined,
    };
  }
  return {};
}

function mapAttioStatus(status: string | undefined): string {
  if (!status) return "OPEN";

  const statusLower = status.toLowerCase();
  if (statusLower.includes("won") || statusLower.includes("closed")) {
    return "WON";
  }
  if (statusLower.includes("lost")) {
    return "LOST";
  }
  return "OPEN";
}
