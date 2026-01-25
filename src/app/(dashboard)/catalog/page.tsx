import { MarketplaceHeader } from "@/components/features/marketplace/marketplace-header";
import { GestureGrid } from "@/components/features/marketplace/gesture-grid";

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <MarketplaceHeader />
      <GestureGrid />
    </div>
  );
}
