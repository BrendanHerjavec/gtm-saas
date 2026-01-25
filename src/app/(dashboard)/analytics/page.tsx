export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLeadStats } from "@/actions/leads";
import { getDealStats, getDealsByStage } from "@/actions/deals";
import { LeadFunnelChart } from "@/components/features/analytics/lead-funnel-chart";
import { DealPipelineChart } from "@/components/features/analytics/deal-pipeline-chart";
import { SourceDistributionChart } from "@/components/features/analytics/source-distribution-chart";
import { formatCurrency } from "@/lib/utils";

export default async function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your GTM performance with detailed insights
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Suspense
            fallback={
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <OverviewStats />
          </Suspense>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Suspense
            fallback={
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <LeadsAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="deals" className="space-y-6">
          <Suspense
            fallback={
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <DealsAnalytics />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function OverviewStats() {
  const [leadStats, dealStats] = await Promise.all([
    getLeadStats(),
    getDealStats(),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Lead Funnel</CardTitle>
          <CardDescription>
            Lead progression through pipeline stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadFunnelChart data={leadStats.byStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Sources</CardTitle>
          <CardDescription>Where your leads are coming from</CardDescription>
        </CardHeader>
        <CardContent>
          <SourceDistributionChart data={leadStats.bySource} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-3xl font-bold">{leadStats.total}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pipeline Value</p>
              <p className="text-3xl font-bold">
                {formatCurrency(dealStats.pipelineValue)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Won Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(dealStats.wonValue)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-3xl font-bold">{dealStats.winRate.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function LeadsAnalytics() {
  const leadStats = await getLeadStats();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Lead Status Distribution</CardTitle>
          <CardDescription>
            Current status of all leads in your pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <LeadFunnelChart data={leadStats.byStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Sources</CardTitle>
          <CardDescription>Distribution of leads by source</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <SourceDistributionChart data={leadStats.bySource} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Lead Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-1 text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">New</p>
              <p className="text-2xl font-bold">{leadStats.byStatus?.NEW || 0}</p>
            </div>
            <div className="space-y-1 text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Contacted</p>
              <p className="text-2xl font-bold">
                {leadStats.byStatus?.CONTACTED || 0}
              </p>
            </div>
            <div className="space-y-1 text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Qualified</p>
              <p className="text-2xl font-bold">
                {leadStats.byStatus?.QUALIFIED || 0}
              </p>
            </div>
            <div className="space-y-1 text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Unqualified</p>
              <p className="text-2xl font-bold">
                {leadStats.byStatus?.UNQUALIFIED || 0}
              </p>
            </div>
            <div className="space-y-1 text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Converted</p>
              <p className="text-2xl font-bold text-green-600">
                {leadStats.byStatus?.CONVERTED || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function DealsAnalytics() {
  const [dealStats, stages] = await Promise.all([
    getDealStats(),
    getDealsByStage(),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Deal Pipeline</CardTitle>
          <CardDescription>Value distribution across pipeline stages</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <DealPipelineChart stages={stages} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deal Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Total Deals</span>
              <span className="font-bold">{dealStats.totalDeals}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Open Deals</span>
              <span className="font-bold">{dealStats.openDeals}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-muted-foreground">Won Deals</span>
              <span className="font-bold text-green-600">{dealStats.wonDeals}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-muted-foreground">Lost Deals</span>
              <span className="font-bold text-red-600">{dealStats.lostDeals}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Pipeline Value</span>
              <span className="font-bold">
                {formatCurrency(dealStats.pipelineValue)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-muted-foreground">Won Revenue</span>
              <span className="font-bold text-green-600">
                {formatCurrency(dealStats.wonValue)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-bold">{dealStats.winRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Avg Deal Size</span>
              <span className="font-bold">
                {dealStats.wonDeals > 0
                  ? formatCurrency(dealStats.wonValue / dealStats.wonDeals)
                  : "$0"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
