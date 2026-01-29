"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, Shuffle, Sparkles } from "lucide-react";
import { createRandomDeck, getAvailableTaskCount } from "@/actions/task-decks";

interface RandomDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RandomDeckDialog({ open, onOpenChange }: RandomDeckDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [taskCount, setTaskCount] = useState(5);
  const [availableCount, setAvailableCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch available task count when dialog opens
  useEffect(() => {
    if (open) {
      getAvailableTaskCount().then((count) => {
        setAvailableCount(count);
        // Set default to min of 5 or available
        setTaskCount(Math.min(5, count));
      });
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (taskCount < 1) {
      setError("Please select at least 1 task");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createRandomDeck(taskCount);

        if (!result.success) {
          setError(result.error || "Failed to create random deck");
          return;
        }

        // Reset and close
        setTaskCount(5);
        onOpenChange(false);
        router.refresh();

        // Navigate to the new deck if we have an ID
        if (result.deckId && result.deckId !== "demo-random-deck") {
          router.push(`/tasks/decks/${result.deckId}`);
        }
      } catch (err) {
        console.error("Failed to create random deck:", err);
        setError("Failed to create random deck");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTaskCount(5);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  const maxTasks = Math.min(availableCount, 20);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-primary" />
            Create Random Pack
          </DialogTitle>
          <DialogDescription>
            Don&apos;t know what to work on? Create a random pack of tasks and let fate decide!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Visual preview */}
            <div className="flex justify-center">
              <div className="relative w-32 h-40 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg flex flex-col items-center justify-center text-white">
                <span className="text-4xl mb-1">🎲</span>
                <span className="text-2xl font-bold">{taskCount}</span>
                <span className="text-xs opacity-80">tasks</span>

                {/* Shimmer effect */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
                </div>
              </div>
            </div>

            {availableCount === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <p>No available tasks to randomize.</p>
                <p className="text-sm mt-1">Create some tasks first!</p>
              </div>
            ) : (
              <>
                {/* Task count slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Number of tasks</Label>
                    <span className="text-sm text-muted-foreground">
                      {availableCount} available
                    </span>
                  </div>

                  <Slider
                    value={[taskCount]}
                    onValueChange={(value) => setTaskCount(value[0])}
                    min={1}
                    max={maxTasks}
                    step={1}
                    className="w-full"
                  />

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={taskCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1 && val <= maxTasks) {
                          setTaskCount(val);
                        }
                      }}
                      min={1}
                      max={maxTasks}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      tasks will be randomly selected
                    </span>
                  </div>
                </div>

                {/* Quick select buttons */}
                <div className="flex gap-2">
                  {[3, 5, 10].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={taskCount === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTaskCount(Math.min(num, maxTasks))}
                      disabled={num > availableCount}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={taskCount === maxTasks ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTaskCount(maxTasks)}
                  >
                    All ({maxTasks})
                  </Button>
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || availableCount === 0 || taskCount < 1}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Random Pack
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
