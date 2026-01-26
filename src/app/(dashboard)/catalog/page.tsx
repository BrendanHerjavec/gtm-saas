export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Package, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketplaceHeader } from "@/components/features/marketplace/marketplace-header";
import { GestureGrid } from "@/components/features/marketplace/gesture-grid";
import { CatalogTable } from "@/components/features/catalog/catalog-table";
import { getGestures } from "@/actions/gestures";
import { getCatalog } from "@/actions/catalog";
import { getAuthSession } from "@/lib/auth";

export default async function CatalogPage() {
  const [{ gestures, total: gestureTotal }, { items, total: itemTotal }, session] = await Promise.all([
    getGestures(),
    getCatalog({ limit: 100 }),
    getAuthSession(),
  ]);

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalog</h1>
          <p className="text-muted-foreground">
            Browse gestures and manage your custom gift items
          </p>
        </div>
        <Link href="/catalog/items/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Gift Item
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList>
          <TabsTrigger value="marketplace" className="gap-2">
            <Gift className="h-4 w-4" />
            Gesture Marketplace ({gestureTotal})
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-2">
            <Package className="h-4 w-4" />
            Custom Items ({itemTotal})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          <MarketplaceHeader showSeedButton={isAdmin} gestureCount={gestureTotal} />
          <GestureGrid initialGestures={gestures} />
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Your Gift Items</CardTitle>
              <CardDescription>
                Custom gift items added by your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No gift items yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add custom gift items to your organization&apos;s catalog
                  </p>
                  <Link href="/catalog/items/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Gift Item
                    </Button>
                  </Link>
                </div>
              ) : (
                <CatalogTable items={items} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
