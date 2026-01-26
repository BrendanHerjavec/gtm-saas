"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Loader2 } from "lucide-react";
import { seedDefaultGestures } from "@/actions/gestures";
import { useRouter } from "next/navigation";

export function SeedGesturesButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleSeed() {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await seedDefaultGestures();
      setResult(response.message);
      router.refresh();
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Failed to seed gestures");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-sm text-muted-foreground">{result}</span>
      )}
      <Button onClick={handleSeed} disabled={isLoading} variant="outline">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Database className="mr-2 h-4 w-4" />
        )}
        Seed Default Gestures
      </Button>
    </div>
  );
}
