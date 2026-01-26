import { MarketplaceHeader } from "@/components/features/marketplace/marketplace-header";
import { GestureGrid } from "@/components/features/marketplace/gesture-grid";
import { getGestures } from "@/actions/gestures";
import { getAuthSession } from "@/lib/auth";

export default async function CatalogPage() {
  const [{ gestures, total }, session] = await Promise.all([
    getGestures(),
    getAuthSession(),
  ]);

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <MarketplaceHeader showSeedButton={isAdmin} gestureCount={total} />
      <GestureGrid initialGestures={gestures} />
    </div>
  );
}
