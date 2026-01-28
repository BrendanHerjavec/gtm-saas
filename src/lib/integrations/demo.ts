/**
 * Demo mode for CRM integrations
 * Allows showcasing the integration functionality without real CRM credentials
 */

import { prisma } from "@/lib/prisma";
import type { CRMProvider } from "./providers/types";

// Demo mode flag - set to true to enable demo integrations
export const DEMO_INTEGRATION_MODE = true;

// Demo provider configuration
export const DEMO_PROVIDERS: Record<string, { name: string; color: string }> = {
  hubspot: { name: "HubSpot (Demo)", color: "bg-green-800" },
  salesforce: { name: "Salesforce (Demo)", color: "bg-blue-500" },
  attio: { name: "Attio (Demo)", color: "bg-purple-500" },
};

/**
 * Create a demo CRM integration for an organization
 */
export async function createDemoIntegration(
  organizationId: string,
  provider: CRMProvider
): Promise<void> {
  // Check if integration already exists
  const existing = await prisma.cRMIntegration.findUnique({
    where: { organizationId },
  });

  if (existing) {
    throw new Error("An integration already exists. Disconnect it first.");
  }

  // Create demo integration with placeholder tokens
  await prisma.cRMIntegration.create({
    data: {
      organizationId,
      provider,
      accessToken: "demo-access-token-not-real",
      refreshToken: "demo-refresh-token-not-real",
      tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      status: "CONNECTED",
      lastSyncAt: new Date(),
      lastSyncStatus: "SUCCESS",
    },
  });

  // Seed demo data
  await seedDemoData(organizationId, provider);

  // Create a sync log entry
  await prisma.syncLog.create({
    data: {
      integrationId: (await prisma.cRMIntegration.findUnique({
        where: { organizationId },
      }))!.id,
      entityType: "all",
      operation: "full_sync",
      direction: "inbound",
      status: "completed",
      recordsProcessed: 25,
      recordsCreated: 25,
      recordsUpdated: 0,
      completedAt: new Date(),
    },
  });
}

/**
 * Seed demo CRM data for an organization
 */
async function seedDemoData(
  organizationId: string,
  provider: CRMProvider
): Promise<void> {
  const now = new Date();

  // Demo companies
  const companies = [
    {
      name: "Acme Corporation",
      domain: "acme.com",
      industry: "Technology",
      size: "500-1000",
      website: "https://acme.com",
      city: "San Francisco",
      state: "CA",
      country: "USA",
    },
    {
      name: "TechStart Inc",
      domain: "techstart.io",
      industry: "Software",
      size: "50-200",
      website: "https://techstart.io",
      city: "Austin",
      state: "TX",
      country: "USA",
    },
    {
      name: "Global Dynamics",
      domain: "globaldynamics.com",
      industry: "Manufacturing",
      size: "1000-5000",
      website: "https://globaldynamics.com",
      city: "Chicago",
      state: "IL",
      country: "USA",
    },
    {
      name: "Innovate Labs",
      domain: "innovatelabs.co",
      industry: "Research",
      size: "10-50",
      website: "https://innovatelabs.co",
      city: "Boston",
      state: "MA",
      country: "USA",
    },
  ];

  const createdCompanies = await Promise.all(
    companies.map((company, index) =>
      prisma.company.create({
        data: {
          ...company,
          organizationId,
          externalId: `demo-company-${index + 1}`,
          externalSource: provider,
          externalUrl: getDemoUrl(provider, "company", index + 1),
          lastSyncedAt: now,
          syncStatus: "SYNCED",
        },
      })
    )
  );

  // Demo contacts
  const contacts = [
    { firstName: "Sarah", lastName: "Chen", email: "sarah.chen@acme.com", jobTitle: "VP of Sales", companyIndex: 0 },
    { firstName: "Michael", lastName: "Johnson", email: "m.johnson@acme.com", jobTitle: "Account Executive", companyIndex: 0 },
    { firstName: "Emily", lastName: "Rodriguez", email: "emily@techstart.io", jobTitle: "CEO", companyIndex: 1 },
    { firstName: "David", lastName: "Kim", email: "david.kim@techstart.io", jobTitle: "CTO", companyIndex: 1 },
    { firstName: "Jennifer", lastName: "Smith", email: "jsmith@globaldynamics.com", jobTitle: "Procurement Manager", companyIndex: 2 },
    { firstName: "Robert", lastName: "Williams", email: "rwilliams@globaldynamics.com", jobTitle: "Director of Operations", companyIndex: 2 },
    { firstName: "Lisa", lastName: "Anderson", email: "lisa@innovatelabs.co", jobTitle: "Founder", companyIndex: 3 },
  ];

  const createdContacts = await Promise.all(
    contacts.map((contact, index) =>
      prisma.contact.create({
        data: {
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          jobTitle: contact.jobTitle,
          organizationId,
          companyId: createdCompanies[contact.companyIndex].id,
          externalId: `demo-contact-${index + 1}`,
          externalSource: provider,
          externalUrl: getDemoUrl(provider, "contact", index + 1),
          lastSyncedAt: now,
          syncStatus: "SYNCED",
        },
      })
    )
  );

  // Demo leads
  const leads = [
    { firstName: "Alex", lastName: "Thompson", email: "alex.t@prospect.com", company: "Prospect Corp", jobTitle: "Marketing Director", status: "NEW", source: "WEBSITE" },
    { firstName: "Maria", lastName: "Garcia", email: "mgarcia@newclient.io", company: "New Client Inc", jobTitle: "Head of Growth", status: "CONTACTED", source: "LINKEDIN" },
    { firstName: "James", lastName: "Wilson", email: "jwilson@enterprise.com", company: "Enterprise Solutions", jobTitle: "VP Engineering", status: "QUALIFIED", source: "REFERRAL" },
    { firstName: "Amanda", lastName: "Brown", email: "amanda@startup.co", company: "Startup Co", jobTitle: "Founder", status: "NEW", source: "EVENT" },
    { firstName: "Chris", lastName: "Lee", email: "chris.lee@bigco.com", company: "BigCo Industries", jobTitle: "Product Manager", status: "CONTACTED", source: "COLD_OUTREACH" },
  ];

  await Promise.all(
    leads.map((lead, index) =>
      prisma.lead.create({
        data: {
          email: lead.email,
          firstName: lead.firstName,
          lastName: lead.lastName,
          company: lead.company,
          jobTitle: lead.jobTitle,
          status: lead.status,
          source: lead.source,
          organizationId,
          externalId: `demo-lead-${index + 1}`,
          externalSource: provider,
          externalUrl: getDemoUrl(provider, "lead", index + 1),
          lastSyncedAt: now,
          syncStatus: "SYNCED",
        },
      })
    )
  );

  // Get or create default deal stage
  let dealStage = await prisma.dealStage.findFirst({
    where: { organizationId },
    orderBy: { order: "asc" },
  });

  if (!dealStage) {
    dealStage = await prisma.dealStage.create({
      data: {
        name: "Prospecting",
        order: 0,
        probability: 10,
        organizationId,
      },
    });

    // Create additional stages
    await prisma.dealStage.createMany({
      data: [
        { name: "Qualification", order: 1, probability: 25, organizationId },
        { name: "Proposal", order: 2, probability: 50, organizationId },
        { name: "Negotiation", order: 3, probability: 75, organizationId },
        { name: "Closed Won", order: 4, probability: 100, organizationId },
      ],
    });
  }

  // Demo deals
  const deals = [
    { name: "Acme Enterprise License", value: 50000, contactIndex: 0, companyIndex: 0, status: "OPEN" },
    { name: "TechStart Annual Contract", value: 25000, contactIndex: 2, companyIndex: 1, status: "OPEN" },
    { name: "Global Dynamics Implementation", value: 150000, contactIndex: 4, companyIndex: 2, status: "OPEN" },
    { name: "Innovate Labs Pilot", value: 10000, contactIndex: 6, companyIndex: 3, status: "OPEN" },
  ];

  await Promise.all(
    deals.map((deal, index) =>
      prisma.deal.create({
        data: {
          name: deal.name,
          value: deal.value,
          status: deal.status,
          organizationId,
          stageId: dealStage!.id,
          contactId: createdContacts[deal.contactIndex].id,
          companyId: createdCompanies[deal.companyIndex].id,
          externalId: `demo-deal-${index + 1}`,
          externalSource: provider,
          externalUrl: getDemoUrl(provider, "deal", index + 1),
          lastSyncedAt: now,
          syncStatus: "SYNCED",
        },
      })
    )
  );
}

/**
 * Generate demo URL for a record
 */
function getDemoUrl(provider: CRMProvider, entityType: string, id: number): string {
  const baseUrls: Record<CRMProvider, string> = {
    hubspot: "https://app.hubspot.com",
    salesforce: "https://na1.salesforce.com",
    attio: "https://app.attio.com",
  };

  const entityPaths: Record<string, Record<CRMProvider, string>> = {
    company: {
      hubspot: "/contacts/companies",
      salesforce: "/lightning/r/Account",
      attio: "/companies",
    },
    contact: {
      hubspot: "/contacts",
      salesforce: "/lightning/r/Contact",
      attio: "/people",
    },
    lead: {
      hubspot: "/contacts",
      salesforce: "/lightning/r/Lead",
      attio: "/people",
    },
    deal: {
      hubspot: "/contacts/deals",
      salesforce: "/lightning/r/Opportunity",
      attio: "/deals",
    },
  };

  return `${baseUrls[provider]}${entityPaths[entityType][provider]}/demo-${id}`;
}

/**
 * Simulate a sync operation for demo mode
 */
export async function simulateDemoSync(organizationId: string): Promise<void> {
  const integration = await prisma.cRMIntegration.findUnique({
    where: { organizationId },
  });

  if (!integration) {
    throw new Error("No integration found");
  }

  // Update integration status to syncing
  await prisma.cRMIntegration.update({
    where: { id: integration.id },
    data: { status: "SYNCING" },
  });

  // Simulate sync delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Update some records with new sync timestamps
  const now = new Date();

  await prisma.lead.updateMany({
    where: { organizationId, externalId: { not: null } },
    data: { lastSyncedAt: now, syncStatus: "SYNCED" },
  });

  await prisma.contact.updateMany({
    where: { organizationId, externalId: { not: null } },
    data: { lastSyncedAt: now, syncStatus: "SYNCED" },
  });

  await prisma.company.updateMany({
    where: { organizationId, externalId: { not: null } },
    data: { lastSyncedAt: now, syncStatus: "SYNCED" },
  });

  await prisma.deal.updateMany({
    where: { organizationId, externalId: { not: null } },
    data: { lastSyncedAt: now, syncStatus: "SYNCED" },
  });

  // Create sync log
  await prisma.syncLog.create({
    data: {
      integrationId: integration.id,
      entityType: "all",
      operation: "incremental",
      direction: "inbound",
      status: "completed",
      recordsProcessed: Math.floor(Math.random() * 10) + 1,
      recordsUpdated: Math.floor(Math.random() * 5),
      completedAt: now,
    },
  });

  // Update integration status
  await prisma.cRMIntegration.update({
    where: { id: integration.id },
    data: {
      status: "CONNECTED",
      lastSyncAt: now,
      lastSyncStatus: "SUCCESS",
    },
  });
}

/**
 * Check if we're in demo integration mode
 */
export function isDemoMode(): boolean {
  return DEMO_INTEGRATION_MODE;
}
