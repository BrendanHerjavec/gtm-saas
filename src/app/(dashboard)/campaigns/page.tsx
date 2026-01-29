export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Loader2, Mail, Send, CheckCircle, Gift } from "lucide-react";
import { getCampaigns, getCampaignStats } from "@/actions/campaigns";
import { CreateCampaignDialog } from "@/components/features/campaigns/create-campaign-dialog";
import { CampaignsTable } from "@/components/features/campaigns/campaigns-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Organize your gifting into campaigns to track delivery and engagement
          </p>
        </div>
        <CreateCampaignDialog />
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </CardHeader>
              </Card>
            ))}
          </div>
        }
      >
        <CampaignStatsCards />
      </Suspense>

      <Card>
        <CardContent className="p-0">
          <Suspense
            fallback={
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <CampaignsTableWrapper />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function CampaignStatsCards() {
  const stats = await getCampaignStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.byStatus?.ACTIVE || 0} active
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gestures Sent</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.metrics.sent}</div>
          <p className="text-xs text-muted-foreground">
            {stats.metrics.deliveryRate.toFixed(1)}% delivered
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
          <Send className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.metrics.openRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.metrics.opened} received
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.metrics.clickRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.metrics.clicked} responses
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function CampaignsTableWrapper() {
  const data = await getCampaigns();

  if (data.campaigns.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <Mail className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No campaigns yet</h3>
        <p className="text-muted-foreground">
          Create your first gifting campaign to start sending
        </p>
      </div>
    );
  }

  // Transform the data to match the expected type
  const campaigns = data.campaigns.map((campaign: any) => ({
    id: campaign.id,
    name: campaign.name,
    subject: campaign.subject,
    status: campaign.status,
    type: campaign.type || "SEQUENCE",
    stats: campaign.stats
      ? {
          sent: campaign.stats.totalSends || 0,
          opened: campaign.stats.shipped || 0,
          clicked: 0,
        }
      : null,
    createdAt: campaign.createdAt,
  }));

  return <CampaignsTable campaigns={campaigns} />;
}
