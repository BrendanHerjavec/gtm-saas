"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { TaskCard } from "./task-card";
import { CompleteTaskDialog } from "./complete-task-dialog";
import { SkipTaskDialog } from "./skip-task-dialog";
import type { OutreachTaskWithRecipient } from "@/actions/outreach-tasks";
import {
  completeOutreachTask,
  skipOutreachTask,
  startOutreachTask,
} from "@/actions/outreach-tasks";

interface TaskDeckProps {
  initialTasks: OutreachTaskWithRecipient[];
  initialTotal: number;
  initialPage: number;
}

type SlideDirection = "left" | "right" | "none";

export function TaskDeck({ initialTasks, initialTotal, initialPage }: TaskDeckProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tasks, setTasks] = useState(initialTasks);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>("none");
  const [isAnimating, setIsAnimating] = useState(false);

  const currentTask = tasks[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < tasks.length - 1;
  const position = currentIndex + 1;
  const total = tasks.length;

  const animateAndNavigate = useCallback((direction: SlideDirection, newIndex: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection(direction);

    // After animation starts, change the index
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setSlideDirection("none");
      setIsAnimating(false);
    }, 200);
  }, [isAnimating]);

  const handlePrevious = useCallback(() => {
    if (hasPrevious && !isAnimating) {
      animateAndNavigate("right", currentIndex - 1);
    }
  }, [hasPrevious, isAnimating, currentIndex, animateAndNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext && !isAnimating) {
      animateAndNavigate("left", currentIndex + 1);
    }
  }, [hasNext, isAnimating, currentIndex, animateAndNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevious, handleNext]);

  const handleStartTask = async (taskId: string) => {
    startTransition(async () => {
      try {
        await startOutreachTask(taskId);
        // Update local state
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: "IN_PROGRESS" } : t
          )
        );
      } catch (error) {
        console.error("Failed to start task:", error);
      }
    });
  };

  const handleCompleteClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCompleteDialogOpen(true);
  };

  const handleSkipClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSkipDialogOpen(true);
  };

  const handleCompleteConfirm = async (data: {
    message?: string;
    videoUrl?: string;
    giftItemId?: string;
    notes?: string;
  }) => {
    if (!selectedTaskId) return;

    startTransition(async () => {
      try {
        await completeOutreachTask({
          taskId: selectedTaskId,
          ...data,
        });

        // Remove the completed task from the list
        setTasks((prev) => prev.filter((t) => t.id !== selectedTaskId));

        // Adjust current index if needed
        if (currentIndex >= tasks.length - 1 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }

        setCompleteDialogOpen(false);
        setSelectedTaskId(null);
        router.refresh();
      } catch (error) {
        console.error("Failed to complete task:", error);
      }
    });
  };

  const handleSkipConfirm = async (reason?: string) => {
    if (!selectedTaskId) return;

    startTransition(async () => {
      try {
        await skipOutreachTask(selectedTaskId, reason);

        // Remove the skipped task from the list
        setTasks((prev) => prev.filter((t) => t.id !== selectedTaskId));

        // Adjust current index if needed
        if (currentIndex >= tasks.length - 1 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }

        setSkipDialogOpen(false);
        setSelectedTaskId(null);
        router.refresh();
      } catch (error) {
        console.error("Failed to skip task:", error);
      }
    });
  };

  // Empty state
  if (!currentTask || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-6 mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">All caught up!</h2>
        <p className="text-muted-foreground max-w-md">
          You&apos;ve completed all your outreach tasks. Great job! Check back later or create new tasks to continue your outreach.
        </p>
        <Button className="mt-6" onClick={() => router.push("/outreach/new")}>
          Create New Task
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!hasPrevious || isPending || isAnimating}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-sm font-medium">
            {position} of {total}
          </Badge>
          {(isPending || isAnimating) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!hasNext || isPending || isAnimating}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Task Card with Animation */}
      <div
        className={`transition-all duration-200 ease-out ${
          slideDirection === "left"
            ? "-translate-x-4 opacity-0"
            : slideDirection === "right"
            ? "translate-x-4 opacity-0"
            : "translate-x-0 opacity-100"
        }`}
      >
        <TaskCard
          task={currentTask}
          onComplete={handleCompleteClick}
          onSkip={handleSkipClick}
          onStart={handleStartTask}
          isLoading={isPending || isAnimating}
        />
      </div>

      {/* Progress Dots */}
      {total > 1 && total <= 10 && (
        <div className="flex justify-center gap-2">
          {tasks.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (index !== currentIndex && !isAnimating) {
                  animateAndNavigate(index > currentIndex ? "left" : "right", index);
                }
              }}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              disabled={isPending || isAnimating}
            />
          ))}
        </div>
      )}

      {/* Complete Task Dialog */}
      <CompleteTaskDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        task={selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : undefined}
        onConfirm={handleCompleteConfirm}
        isLoading={isPending}
      />

      {/* Skip Task Dialog */}
      <SkipTaskDialog
        open={skipDialogOpen}
        onOpenChange={setSkipDialogOpen}
        onConfirm={handleSkipConfirm}
        isLoading={isPending}
      />
    </div>
  );
}
