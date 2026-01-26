"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RowActions,
  createEditAction,
  createDeleteAction,
} from "@/components/ui/row-actions";
import { deleteBudget } from "@/actions/budget";
import { useToast } from "@/hooks/use-toast";

type Budget = {
  id: string;
  name: string;
  type: string;
  amount: number;
  spent: number;
  startDate: Date;
  endDate: Date;
};

interface BudgetTableProps {
  budgets: Budget[];
}

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

export function BudgetTable({ budgets }: BudgetTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const now = new Date();

  const handleDelete = async (id: string, name: string) => {
    await deleteBudget(id);
    toast({
      title: "Budget deleted",
      description: `"${name}" has been deleted.`,
      variant: "success",
    });
    router.refresh();
  };

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">Name</th>
            <th className="text-left py-3 px-4 font-medium">Type</th>
            <th className="text-left py-3 px-4 font-medium">Period</th>
            <th className="text-left py-3 px-4 font-medium">Amount</th>
            <th className="text-left py-3 px-4 font-medium">Progress</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((budget) => {
            const isActive =
              new Date(budget.startDate) <= now && new Date(budget.endDate) >= now;
            const isPast = new Date(budget.endDate) < now;
            const percentUsed = (budget.spent / budget.amount) * 100;
            const isOverBudget = percentUsed > 100;
            const isNearLimit = percentUsed >= 80 && percentUsed <= 100;

            return (
              <tr key={budget.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4 font-medium">{budget.name}</td>
                <td className="py-3 px-4">
                  <Badge variant="outline">{budget.type}</Badge>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                </td>
                <td className="py-3 px-4">{formatCurrency(budget.amount)}</td>
                <td className="py-3 px-4">
                  <div className="space-y-1 min-w-[150px]">
                    <div className="flex items-center justify-between text-xs">
                      <span>{formatCurrency(budget.spent)}</span>
                      <span
                        className={
                          isOverBudget
                            ? "text-destructive"
                            : isNearLimit
                            ? "text-yellow-600"
                            : "text-muted-foreground"
                        }
                      >
                        {Math.round(percentUsed)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentUsed, 100)}
                      className={`h-2 ${
                        isOverBudget
                          ? "[&>div]:bg-destructive"
                          : isNearLimit
                          ? "[&>div]:bg-yellow-500"
                          : ""
                      }`}
                    />
                  </div>
                </td>
                <td className="py-3 px-4">
                  {isOverBudget ? (
                    <Badge variant="destructive">Over Budget</Badge>
                  ) : isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : isPast ? (
                    <Badge variant="secondary">Completed</Badge>
                  ) : (
                    <Badge variant="outline">Upcoming</Badge>
                  )}
                </td>
                <td className="py-3 px-4">
                  <RowActions
                    actions={[
                      createEditAction(`/budget/${budget.id}/edit`),
                      createDeleteAction(
                        () => handleDelete(budget.id, budget.name),
                        "budget"
                      ),
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
