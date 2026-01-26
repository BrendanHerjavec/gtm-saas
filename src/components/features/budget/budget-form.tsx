"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBudget, updateBudget } from "@/actions/budget";
import { createBudgetSchema, type CreateBudgetInput } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";

type Budget = {
  id: string;
  name: string;
  type: string;
  amount: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  alertThreshold: number | null;
};

interface BudgetFormProps {
  budget?: Budget;
  onSuccess?: () => void;
}

const budgetTypes = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUAL", label: "Annual" },
  { value: "CUSTOM", label: "Custom" },
];

export function BudgetForm({ budget, onSuccess }: BudgetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const formatDateForInput = (date: Date | string) => {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBudgetInput>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      name: budget?.name || "",
      totalAmount: budget?.amount || 0,
      period: (budget?.type as CreateBudgetInput["period"]) || "MONTHLY",
      startDate: budget?.startDate || new Date(),
      endDate: budget?.endDate || undefined,
      alertThreshold: budget?.alertThreshold || 80,
    },
  });

  const selectedPeriod = watch("period");

  const onSubmit = async (data: CreateBudgetInput) => {
    setIsLoading(true);
    try {
      const budgetData = {
        name: data.name,
        type: data.period,
        amount: data.totalAmount,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : calculateEndDate(new Date(data.startDate), data.period),
        alertThreshold: data.alertThreshold,
      };

      if (budget) {
        await updateBudget(budget.id, budgetData);
        toast({
          title: "Budget updated",
          description: "Your budget has been updated successfully.",
          variant: "success",
        });
      } else {
        await createBudget(budgetData);
        toast({
          title: "Budget created",
          description: "Your new budget has been created.",
          variant: "success",
        });
      }
      router.push("/budget");
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: budget ? "Failed to update budget" : "Failed to create budget",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEndDate = (startDate: Date, period: string): Date => {
    const end = new Date(startDate);
    switch (period) {
      case "MONTHLY":
        end.setMonth(end.getMonth() + 1);
        break;
      case "QUARTERLY":
        end.setMonth(end.getMonth() + 3);
        break;
      case "ANNUAL":
        end.setFullYear(end.getFullYear() + 1);
        break;
      default:
        end.setMonth(end.getMonth() + 1);
    }
    end.setDate(end.getDate() - 1);
    return end;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
          <CardDescription>Set up your budget parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Budget Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Q1 2024 Gifting Budget"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="10000"
                  className="pl-7"
                  {...register("totalAmount", { valueAsNumber: true })}
                  disabled={isLoading}
                />
              </div>
              {errors.totalAmount && (
                <p className="text-sm text-destructive">{errors.totalAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Budget Period *</Label>
              <Select
                defaultValue={budget?.type || "MONTHLY"}
                onValueChange={(value) => setValue("period", value as CreateBudgetInput["period"])}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {budgetTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                defaultValue={budget ? formatDateForInput(budget.startDate) : formatDateForInput(new Date())}
                {...register("startDate", { valueAsDate: true })}
                disabled={isLoading}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date {selectedPeriod === "CUSTOM" ? "*" : "(optional)"}
              </Label>
              <Input
                id="endDate"
                type="date"
                defaultValue={budget ? formatDateForInput(budget.endDate) : ""}
                {...register("endDate", { valueAsDate: true })}
                disabled={isLoading}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
              {selectedPeriod !== "CUSTOM" && (
                <p className="text-xs text-muted-foreground">
                  Leave blank to auto-calculate based on period
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Alerts</CardTitle>
          <CardDescription>Get notified when approaching your budget limit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
            <Input
              id="alertThreshold"
              type="number"
              min="0"
              max="100"
              placeholder="80"
              {...register("alertThreshold", { valueAsNumber: true })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              You'll receive an alert when you reach this percentage of your budget
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {budget ? "Update Budget" : "Create Budget"}
        </Button>
      </div>
    </form>
  );
}
