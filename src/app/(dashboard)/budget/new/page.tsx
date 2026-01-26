import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BudgetForm } from "@/components/features/budget/budget-form";

export default function NewBudgetPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/budget">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Budget</h1>
          <p className="text-muted-foreground">
            Set up a new budget to track your gifting spend
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <BudgetForm />
      </div>
    </div>
  );
}
