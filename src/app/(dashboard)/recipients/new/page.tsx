import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RecipientForm } from "@/components/features/recipients/recipient-form";

export default function NewRecipientPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/recipients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Recipient</h1>
          <p className="text-muted-foreground">
            Add a new person to your recipient list
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <RecipientForm />
      </div>
    </div>
  );
}
