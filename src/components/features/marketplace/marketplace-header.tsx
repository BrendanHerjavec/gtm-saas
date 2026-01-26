import { Gift } from "lucide-react";
import { SeedGesturesButton } from "./seed-gestures-button";

interface MarketplaceHeaderProps {
  showSeedButton?: boolean;
  gestureCount?: number;
}

export function MarketplaceHeader({ showSeedButton, gestureCount = 0 }: MarketplaceHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Gesture Marketplace</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Choose meaningful gestures to include in your campaigns. All gestures are
          handled by our fulfillment partners.
        </p>
      </div>
      {showSeedButton && gestureCount === 0 && <SeedGesturesButton />}
    </div>
  );
}
