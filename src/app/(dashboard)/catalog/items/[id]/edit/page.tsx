export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiftItemForm } from "@/components/features/catalog/gift-item-form";
import { getGiftItem, getCategories, getVendors } from "@/actions/catalog";

interface EditGiftItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGiftItemPage({ params }: EditGiftItemPageProps) {
  const { id } = await params;
  const [giftItem, categories, vendors] = await Promise.all([
    getGiftItem(id),
    getCategories(),
    getVendors(),
  ]);

  if (!giftItem) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/catalog">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Gift Item</h1>
          <p className="text-muted-foreground">
            Update {giftItem.name}
          </p>
        </div>
      </div>

      <GiftItemForm
        giftItem={giftItem}
        categories={categories}
        vendors={vendors}
      />
    </div>
  );
}
