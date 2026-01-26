"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exitDemoMode } from "@/actions/demo";

interface DemoBannerProps {
  isDemo: boolean;
}

export function DemoBanner({ isDemo }: DemoBannerProps) {
  if (!isDemo) return null;

  return (
    <div className="flex items-center justify-between bg-amber-500 px-4 py-2 text-amber-950">
      <span className="text-sm font-medium">
        You&apos;re in demo mode. Sign up to save your data.
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-xs"
          asChild
        >
          <a href="/register">Sign up</a>
        </Button>
        <form action={exitDemoMode}>
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-amber-950 hover:bg-amber-600 hover:text-amber-950"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Exit demo</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
