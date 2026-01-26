export const dynamic = "force-dynamic";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SendForm } from "@/components/features/sends/send-form";
import { getRecipients } from "@/actions/recipients";
import { getCatalog } from "@/actions/catalog";
import { getCampaigns } from "@/actions/campaigns";

export default async function NewSendPage() {
  const [recipientsData, catalogData, campaignsData] = await Promise.all([
    getRecipients({ limit: 100 }),
    getCatalog({ limit: 100 }),
    getCampaigns({ limit: 100 }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/sends">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Send</h1>
          <p className="text-muted-foreground">
            Send a gift, note, or experience to a recipient
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <SendForm
          recipients={recipientsData.recipients}
          giftItems={catalogData.items}
          campaigns={campaignsData.campaigns}
        />
      </div>
    </div>
  );
}
