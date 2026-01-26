export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RecipientForm } from "@/components/features/recipients/recipient-form";
import { getRecipient } from "@/actions/recipients";

interface EditRecipientPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipientPage({ params }: EditRecipientPageProps) {
  const { id } = await params;
  const recipient = await getRecipient(id);

  if (!recipient) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/recipients/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Recipient</h1>
          <p className="text-muted-foreground">
            Update information for {recipient.firstName} {recipient.lastName}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <RecipientForm recipient={recipient} />
      </div>
    </div>
  );
}
