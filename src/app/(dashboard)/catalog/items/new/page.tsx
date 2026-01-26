export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiftItemForm } from "@/components/features/catalog/gift-item-form";
import { getCategories, getVendors } from "@/actions/catalog";

export default async function NewGiftItemPage() {
  const [categories, vendors] = await Promise.all([
    getCategories(),
    getVendors(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/catalog">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Gift Item</h1>
          <p className="text-muted-foreground">
            Add a new item to your organization&apos;s catalog
          </p>
        </div>
      </div>

      <GiftItemForm categories={categories} vendors={vendors} />
    </div>
  );
}
