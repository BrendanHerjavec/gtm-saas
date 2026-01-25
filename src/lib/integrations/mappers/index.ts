import type {
  CRMProvider,
  EntityType,
  ExternalRecord,
  MappedLead,
  MappedContact,
  MappedCompany,
  MappedDeal,
  MappedRecord,
} from "../providers/types";

import {
  mapHubSpotToLead,
  mapHubSpotToContact,
  mapHubSpotToCompany,
  mapHubSpotToDeal,
} from "./hubspot";

import {
  mapSalesforceToLead,
  mapSalesforceToContact,
  mapSalesforceToCompany,
  mapSalesforceToDeal,
} from "./salesforce";

import {
  mapAttioToLead,
  mapAttioToContact,
  mapAttioToCompany,
  mapAttioToDeal,
} from "./attio";

export * from "./hubspot";
export * from "./salesforce";
export * from "./attio";

/**
 * Map external CRM record to local format based on provider and entity type
 */
export function mapExternalToLocal(
  provider: CRMProvider,
  entityType: EntityType,
  record: ExternalRecord,
  instanceUrl?: string
): MappedRecord {
  switch (provider) {
    case "hubspot":
      return mapHubSpotRecord(entityType, record);
    case "salesforce":
      return mapSalesforceRecord(entityType, record, instanceUrl || "");
    case "attio":
      return mapAttioRecord(entityType, record);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function mapHubSpotRecord(
  entityType: EntityType,
  record: ExternalRecord
): MappedRecord {
  switch (entityType) {
    case "lead":
      return mapHubSpotToLead(record);
    case "contact":
      return mapHubSpotToContact(record);
    case "company":
      return mapHubSpotToCompany(record);
    case "deal":
      return mapHubSpotToDeal(record);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

function mapSalesforceRecord(
  entityType: EntityType,
  record: ExternalRecord,
  instanceUrl: string
): MappedRecord {
  switch (entityType) {
    case "lead":
      return mapSalesforceToLead(record, instanceUrl);
    case "contact":
      return mapSalesforceToContact(record, instanceUrl);
    case "company":
      return mapSalesforceToCompany(record, instanceUrl);
    case "deal":
      return mapSalesforceToDeal(record, instanceUrl);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

function mapAttioRecord(
  entityType: EntityType,
  record: ExternalRecord
): MappedRecord {
  switch (entityType) {
    case "lead":
      return mapAttioToLead(record);
    case "contact":
      return mapAttioToContact(record);
    case "company":
      return mapAttioToCompany(record);
    case "deal":
      return mapAttioToDeal(record);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Check if a mapped record is a lead
 */
export function isMappedLead(record: MappedRecord): record is MappedLead {
  return "source" in record && "status" in record;
}

/**
 * Check if a mapped record is a contact
 */
export function isMappedContact(record: MappedRecord): record is MappedContact {
  return "linkedinUrl" in record || "externalCompanyId" in record;
}

/**
 * Check if a mapped record is a company
 */
export function isMappedCompany(record: MappedRecord): record is MappedCompany {
  return "domain" in record || "industry" in record;
}

/**
 * Check if a mapped record is a deal
 */
export function isMappedDeal(record: MappedRecord): record is MappedDeal {
  return "value" in record || "stageName" in record;
}
