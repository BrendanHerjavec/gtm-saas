export const dynamic = "force-dynamic";

import { Suspense } from "react";
import {
  Loader2,
  Gift,
  PenLine,
  Video,
  Calendar,
  Mail,
  Send,
  CheckCircle,
  Truck,
  Clock,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSendStats } from "@/actions/sends";
import { getTaskDeckStats } from "@/actions/tasks";
import { getBudgetSummary } from "@/actions/budget";
import { getCampaignStats } from "@/actions/campaigns";
import { formatCurrency } from "@/lib/utils";

export default async function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your gifting performance and engagement across all campaigns
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sends">Sends</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
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

        <TabsContent value="sends" className="space-y-6">
          <Suspense
            fallback={
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <SendsAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Suspense
            fallback={
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <TasksAnalytics />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function OverviewStats() {
  const [sendStats, budgetSummary, campaignStats] = await Promise.all([
    getSendStats(),
    getBudgetSummary(),
    getCampaignStats(),
  ]);

  const totalSent = sendStats?.total || 0;
  const delivered = sendStats?.delivered || 0;
  const deliveryRate = totalSent > 0 ? ((delivered / totalSent) * 100) : 0;
  const totalSpent = sendStats?.totalSpent || 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sends</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSent}</div>
            <p className="text-xs text-muted-foreground">
              Gifts, notes, videos & experiences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {deliveryRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {delivered} successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all gifting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {campaignStats.byStatus?.ACTIVE || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {campaignStats.total} total campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Send Status + Budget */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send Status Breakdown</CardTitle>
            <CardDescription>
              Current status of all gifts and touches sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatusBar
                label="Delivered"
                value={sendStats?.delivered || 0}
                total={totalSent}
                color="bg-green-500"
              />
              <StatusBar
                label="Shipped"
                value={sendStats?.shipped || 0}
                total={totalSent}
                color="bg-blue-500"
              />
              <StatusBar
                label="Pending"
                value={sendStats?.pending || 0}
                total={totalSent}
                color="bg-yellow-500"
              />
              <StatusBar
                label="Failed"
                value={sendStats?.failed || 0}
                total={totalSent}
                color="bg-red-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Usage</CardTitle>
            <CardDescription>
              How your gifting budget is being used
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgetSummary?.activeBudget ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {budgetSummary.activeBudget.name}
                  </p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(budgetSummary.activeBudget.spent)}{" "}
                    <span className="text-lg font-normal text-muted-foreground">
                      / {formatCurrency(budgetSummary.activeBudget.amount)}
                    </span>
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-4">
                  <div
                    className="bg-primary h-4 rounded-full transition-all"
                    style={{ width: `${Math.min(budgetSummary.percentUsed || 0, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{Math.round(budgetSummary.percentUsed || 0)}% used</span>
                  <span>{formatCurrency(budgetSummary.remaining || 0)} remaining</span>
                </div>
                {totalSent > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Average cost per send:{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(totalSpent / totalSent)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active budget configured</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function SendsAnalytics() {
  const sendStats = await getSendStats();
  const totalSent = sendStats?.total || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Performance</CardTitle>
          <CardDescription>
            Delivery status across all gifts and personal touches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex flex-col items-center p-4 rounded-lg bg-yellow-500/10">
              <Clock className="h-8 w-8 text-yellow-500 mb-2" />
              <span className="text-2xl font-bold">{sendStats?.pending || 0}</span>
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-blue-500/10">
              <Truck className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-2xl font-bold">{sendStats?.shipped || 0}</span>
              <span className="text-sm text-muted-foreground">Shipped</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-2xl font-bold">{sendStats?.delivered || 0}</span>
              <span className="text-sm text-muted-foreground">Delivered</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-red-500/10">
              <Send className="h-8 w-8 text-red-500 mb-2" />
              <span className="text-2xl font-bold">{sendStats?.failed || 0}</span>
              <span className="text-sm text-muted-foreground">Failed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend Summary</CardTitle>
          <CardDescription>
            How your gifting budget is being allocated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1 text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">
                {formatCurrency(sendStats?.totalSpent || 0)}
              </p>
            </div>
            <div className="space-y-1 text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Avg per Send</p>
              <p className="text-2xl font-bold">
                {totalSent > 0
                  ? formatCurrency((sendStats?.totalSpent || 0) / totalSent)
                  : "$0"}
              </p>
            </div>
            <div className="space-y-1 text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Delivery Success</p>
              <p className="text-2xl font-bold text-green-600">
                {totalSent > 0
                  ? `${(((sendStats?.delivered || 0) / totalSent) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function TasksAnalytics() {
  const stats = await getTaskDeckStats();

  const taskTypes = [
    { type: "GIFT" as const, label: "Gifts", icon: Gift, color: "text-orange-500", bgColor: "bg-orange-500/10" },
    { type: "HANDWRITTEN_NOTE" as const, label: "Handwritten Notes", icon: PenLine, color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { type: "VIDEO" as const, label: "Personal Videos", icon: Video, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { type: "EXPERIENCE" as const, label: "Experiences", icon: Calendar, color: "text-green-500", bgColor: "bg-green-500/10" },
    { type: "DIRECT_MAIL" as const, label: "Direct Mail", icon: Mail, color: "text-rose-500", bgColor: "bg-rose-500/10" },
  ];

  const total = stats?.total || 0;
  const completed = stats?.completed || 0;
  const completionRate = total > 0 ? ((completed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.actionable || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks by Type</CardTitle>
          <CardDescription>
            Breakdown of pending tasks across all touch types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {taskTypes.map((taskType) => {
              const count = stats?.byType[taskType.type] || 0;
              const Icon = taskType.icon;
              return (
                <div
                  key={taskType.type}
                  className={`flex flex-col items-center p-4 rounded-lg ${taskType.bgColor}`}
                >
                  <Icon className={`h-8 w-8 mb-2 ${taskType.color}`} />
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-xs text-center text-muted-foreground">
                    {taskType.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <StatusBar
              label="Completed"
              value={completed}
              total={total}
              color="bg-green-500"
            />
            <StatusBar
              label="In Progress"
              value={stats?.inProgress || 0}
              total={total}
              color="bg-blue-500"
            />
            <StatusBar
              label="Pending"
              value={stats?.pending || 0}
              total={total}
              color="bg-yellow-500"
            />
            <StatusBar
              label="Skipped"
              value={stats?.skipped || 0}
              total={total}
              color="bg-gray-400"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
