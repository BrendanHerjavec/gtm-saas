import { getBudgets, getBudgetSummary } from "@/actions/budget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  Plus,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BudgetPage() {
  const [budgets, summary] = await Promise.all([
    getBudgets(),
    getBudgetSummary(),
  ]);

  const now = new Date();
  const activeBudgets = budgets.filter(
    (b) => new Date(b.startDate) <= now && new Date(b.endDate) >= now
  );
  const upcomingBudgets = budgets.filter(
    (b) => new Date(b.startDate) > now
  );
  const pastBudgets = budgets.filter(
    (b) => new Date(b.endDate) < now
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground">
            Track and manage your gifting budget
          </p>
        </div>
        <Link href="/budget/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Budget
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.monthlySpend || 0)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.totalSpend || 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.remaining !== null
                ? formatCurrency(summary.remaining)
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Active budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.percentUsed !== null
                ? `${Math.round(summary.percentUsed)}%`
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Active budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Budget */}
      {summary?.activeBudget && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Budget</CardTitle>
                <CardDescription>{summary.activeBudget.name}</CardDescription>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>
                {formatCurrency(summary.activeBudget.spent)} of{" "}
                {formatCurrency(summary.activeBudget.amount)}
              </span>
              <span className="text-muted-foreground">
                {Math.round(summary.percentUsed || 0)}% used
              </span>
            </div>
            <Progress value={summary.percentUsed || 0} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {formatDate(summary.activeBudget.startDate)} -{" "}
                {formatDate(summary.activeBudget.endDate)}
              </span>
              <span>
                {formatCurrency(summary.remaining || 0)} remaining
              </span>
            </div>
            {summary.percentUsed && summary.percentUsed >= 80 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  You&apos;ve used {Math.round(summary.percentUsed)}% of your budget
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>All Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No budgets yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a budget to track your gifting spend
              </p>
              <Link href="/budget/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Budget
                </Button>
              </Link>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Period</th>
                    <th className="text-left py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Spent</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => {
                    const isActive =
                      new Date(budget.startDate) <= now &&
                      new Date(budget.endDate) >= now;
                    const isPast = new Date(budget.endDate) < now;
                    const percentUsed = (budget.spent / budget.amount) * 100;

                    return (
                      <tr key={budget.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{budget.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{budget.type}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(budget.startDate)} -{" "}
                          {formatDate(budget.endDate)}
                        </td>
                        <td className="py-3 px-4">
                          {formatCurrency(budget.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span>{formatCurrency(budget.spent)}</span>
                            <span className="text-muted-foreground text-xs">
                              ({Math.round(percentUsed)}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : isPast ? (
                            <Badge variant="secondary">Completed</Badge>
                          ) : (
                            <Badge variant="outline">Upcoming</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
