import { Suspense } from "react";
import { getOutreachTasks, getTaskDeckStats } from "@/actions/tasks";
import { getTaskDecks } from "@/actions/task-decks";
import { TasksPageClient } from "./tasks-page-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Tasks | GTM SaaS",
  description: "Manage your task decks and work through tasks",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-64" />

      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

async function TasksContent() {
  const [decksResult, tasksResult, stats] = await Promise.all([
    getTaskDecks({ limit: 50 }),
    getOutreachTasks({ status: "PENDING", limit: 50 }),
    getTaskDeckStats(),
  ]);

  // Include in-progress tasks as well
  const inProgressResult = await getOutreachTasks({ status: "IN_PROGRESS", limit: 50 });

  // Combine and sort tasks (in-progress first, then by priority)
  const allTasks = [...inProgressResult.tasks, ...tasksResult.tasks];

  return (
    <TasksPageClient
      decks={decksResult.decks}
      initialTasks={allTasks}
      initialTotal={tasksResult.total + inProgressResult.total}
      initialStats={stats}
    />
  );
}

export default function TasksPage() {
  return (
    <div className="container max-w-6xl py-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <TasksContent />
      </Suspense>
    </div>
  );
}
