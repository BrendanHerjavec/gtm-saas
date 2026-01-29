"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { TaskDeck } from "@/components/features/tasks";
import type { TaskDeckWithCreator } from "@/actions/task-decks";
import type { OutreachTaskWithRecipient } from "@/actions/tasks";

interface DeckWorkClientProps {
  deck: TaskDeckWithCreator;
  initialTasks: OutreachTaskWithRecipient[];
}

export function DeckWorkClient({ deck, initialTasks }: DeckWorkClientProps) {
  const completedCount = deck.completedTasks + deck.skippedTasks;
  const progress = deck.totalTasks > 0
    ? Math.round((completedCount / deck.totalTasks) * 100)
    : 0;

  // Empty state - all tasks completed
  if (initialTasks.length === 0) {
    return (
      <div className="space-y-6">
        <Link
          href="/tasks"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tasks
        </Link>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-6 mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Deck Complete!</h2>
          <p className="text-muted-foreground max-w-md mb-4">
            You&apos;ve finished all tasks in &ldquo;{deck.name}&rdquo;. Great job!
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Badge variant="secondary">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              {deck.completedTasks} completed
            </Badge>
            {deck.skippedTasks > 0 && (
              <Badge variant="outline">
                {deck.skippedTasks} skipped
              </Badge>
            )}
          </div>
          <Link href="/tasks">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Decks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/tasks"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tasks
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: deck.coverColor || "#3B82F6" }}
          >
            <span className="text-lg">{deck.emoji || "📦"}</span>
          </div>
          <div>
            <h1 className="font-semibold">{deck.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layers className="h-3 w-3" />
              <span>{initialTasks.length} remaining</span>
              <span>•</span>
              <span>{progress}% complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Task Deck */}
      <TaskDeck
        initialTasks={initialTasks}
        initialTotal={initialTasks.length}
        initialPage={1}
      />
    </div>
  );
}
