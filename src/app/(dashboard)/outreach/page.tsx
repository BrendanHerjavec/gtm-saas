import { Suspense } from "react";
import { getOutreachTasks, getTaskDeckStats } from "@/actions/outreach-tasks";
import { OutreachDeckClient } from "./outreach-deck-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Outreach | GTM SaaS",
  description: "Work through your outreach tasks one by one",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      </div>

      {/* Card skeleton */}
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    </div>
  );
}

async function OutreachContent() {
  const [tasksResult, stats] = await Promise.all([
    getOutreachTasks({ status: "PENDING", limit: 50 }),
    getTaskDeckStats(),
  ]);

  // Include in-progress tasks as well
  const inProgressResult = await getOutreachTasks({ status: "IN_PROGRESS", limit: 50 });

  // Combine and sort tasks (in-progress first, then by priority)
  const allTasks = [...inProgressResult.tasks, ...tasksResult.tasks];

  return (
    <OutreachDeckClient
      initialTasks={allTasks}
      initialTotal={tasksResult.total + inProgressResult.total}
      initialStats={stats}
    />
  );
}

export default function OutreachPage() {
  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Outreach Deck</h1>
        <p className="text-muted-foreground mt-2">
          Work through your outreach tasks one card at a time. Complete or skip to move to the next.
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <OutreachContent />
      </Suspense>
    </div>
  );
}
