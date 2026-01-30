export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { IntegrationsHeader } from "@/components/features/integrations/integrations-header";
import { IntegrationCard, type Integration } from "@/components/features/integrations/integration-card";
import { CRMProviders } from "@/components/features/integrations/crm-providers";
import { ConnectedIntegration } from "@/components/features/integrations/connected-integration";
import { CsvImportSection } from "@/components/features/integrations/csv-import-section";
import { getIntegrationStatus } from "@/actions/integrations";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageSquare, Calendar, Zap, Webhook } from "lucide-react";

// Other integrations (non-CRM)
const otherIntegrations: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Get real-time notifications when gestures are delivered or replies received.",
    category: "Notifications",
    icon: MessageSquare,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Trigger gestures based on meeting events and scheduling.",
    category: "Calendar",
    icon: Calendar,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect to 5,000+ apps with custom automation workflows.",
    category: "Automation",
    icon: Zap,
    popular: true,
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description: "Create custom triggers and receive event notifications via HTTP.",
    category: "Developer",
    icon: Webhook,
  },
];

function CRMIntegrationSection() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      }
    >
      <CRMIntegrationContent />
    </Suspense>
  );
}

async function CRMIntegrationContent() {
  const integrationStatus = await getIntegrationStatus();

  if (integrationStatus.connected) {
    return <ConnectedIntegration integration={integrationStatus} />;
  }

  return <CRMProviders />;
}

export default function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  return (
    <div className="space-y-8">
      <IntegrationsHeader />

      {/* Success/Error Messages */}
      <Suspense fallback={null}>
        <IntegrationMessages searchParams={searchParams} />
      </Suspense>

      {/* CRM Integration Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Sync from Your CRM</h2>
        <CRMIntegrationSection />
      </section>

      {/* CSV Import Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Import from CSV</h2>
        <CsvImportSection />
      </section>

      {/* Other Integrations */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Other Integrations</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {otherIntegrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      </section>
    </div>
  );
}

async function IntegrationMessages({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const params = await searchParams;

  if (params.connected) {
    return (
      <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-4">
        <p className="text-green-700 dark:text-green-400 text-sm">
          Successfully connected to{" "}
          <span className="font-medium capitalize">{params.connected}</span>!
          Your data will begin syncing shortly.
        </p>
      </div>
    );
  }

  if (params.error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4">
        <p className="text-red-700 dark:text-red-400 text-sm">
          Connection failed: {decodeURIComponent(params.error)}
        </p>
      </div>
    );
  }

  return null;
}
