export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import {
  Send,
  Gift,
  UserCircle,
  Wallet,
  TrendingUp,
  ArrowRight,
  Loader2,
  Zap,
  Plus,
  CheckCircle,
  Clock,
  Truck,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSendStats } from "@/actions/sends";
import { getBudgetSummary } from "@/actions/budget";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground">
            Create meaningful moments that close deals.
          </p>
        </div>
        <Link href="/sends/new">
          <Button className="bg-gradient-to-r from-green-800 to-emerald-700 hover:from-green-900 hover:to-emerald-800">
            <Plus className="mr-2 h-4 w-4" />
            New Send
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <DashboardStats />
      </Suspense>

      {/* Send Status Overview */}
      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        }
      >
        <SendStatusOverview />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/sends/new" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center">
                  <Send className="mr-2 h-4 w-4" />
                  Send a Gift
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/catalog" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center">
                  <Gift className="mr-2 h-4 w-4" />
                  Browse Catalog
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/recipients" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Manage Recipients
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/campaigns" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center">
                  <Zap className="mr-2 h-4 w-4" />
                  Create Campaign
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/integrations" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Connect CRM
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Budget Overview */}
        <Suspense
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          }
        >
          <BudgetOverviewCard />
        </Suspense>
      </div>
    </div>
  );
}

async function DashboardStats() {
  const [sendStats, budgetSummary] = await Promise.all([
    getSendStats(),
    getBudgetSummary(),
  ]);

  const stats = [
    {
      title: "Total Sends",
      value: sendStats?.total?.toString() || "0",
      description: `${sendStats?.pending || 0} pending`,
      icon: Send,
    },
    {
      title: "Delivered",
      value: sendStats?.delivered?.toString() || "0",
      description: "Successfully delivered",
      icon: CheckCircle,
    },
    {
      title: "Total Spent",
      value: formatCurrency(sendStats?.totalSpent || 0),
      description: "All time",
      icon: Wallet,
    },
    {
      title: "Monthly Spend",
      value: formatCurrency(budgetSummary?.monthlySpend || 0),
      description: "This month",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function SendStatusOverview() {
  const stats = await getSendStats();

  const statuses = [
    { label: "Pending", value: stats?.pending || 0, icon: Clock, color: "text-yellow-500" },
    { label: "Shipped", value: stats?.shipped || 0, icon: Truck, color: "text-blue-500" },
    { label: "Delivered", value: stats?.delivered || 0, icon: CheckCircle, color: "text-green-500" },
    { label: "Failed", value: stats?.failed || 0, icon: Package, color: "text-red-500" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Send Status Overview</CardTitle>
        <Link href="/sends">
          <Button variant="ghost" size="sm">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statuses.map((status) => (
            <div
              key={status.label}
              className="flex flex-col items-center p-4 rounded-lg bg-muted/50"
            >
              <status.icon className={`h-8 w-8 ${status.color} mb-2`} />
              <span className="text-2xl font-bold">{status.value}</span>
              <span className="text-sm text-muted-foreground">{status.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function BudgetOverviewCard() {
  const summary = await getBudgetSummary();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Budget Overview</CardTitle>
        <Link href="/budget">
          <Button variant="ghost" size="sm">
            Manage
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {summary?.activeBudget ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Budget</span>
              <Badge variant="default">{summary.activeBudget.name}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Spent</span>
                <span className="font-medium">
                  {formatCurrency(summary.activeBudget.spent)} / {formatCurrency(summary.activeBudget.amount)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(summary.percentUsed || 0, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{Math.round(summary.percentUsed || 0)}% used</span>
                <span>{formatCurrency(summary.remaining || 0)} remaining</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No active budget</p>
            <Link href="/budget/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Budget
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
