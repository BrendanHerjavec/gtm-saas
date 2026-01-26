export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BudgetForm } from "@/components/features/budget/budget-form";
import { getBudget } from "@/actions/budget";

interface EditBudgetPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBudgetPage({ params }: EditBudgetPageProps) {
  const { id } = await params;
  const budget = await getBudget(id);

  if (!budget) {
    notFound();
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Edit Budget</h1>
          <p className="text-muted-foreground">
            Update {budget.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <BudgetForm budget={budget} />
      </div>
    </div>
  );
}
