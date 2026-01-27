"use client";

import { useState, useMemo } from "react";
import { TaskDeck, TaskDeckHeader } from "@/components/features/outreach";
import type { OutreachTaskWithRecipient } from "@/actions/outreach-tasks";

interface TaskDeckStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  skipped: number;
  actionable: number;
  byType: {
    GIFT: number;
    HANDWRITTEN_NOTE: number;
    VIDEO: number;
    EXPERIENCE: number;
    DIRECT_MAIL: number;
  };
}

interface OutreachDeckClientProps {
  initialTasks: OutreachTaskWithRecipient[];
  initialTotal: number;
  initialStats: TaskDeckStats | null;
}

export function OutreachDeckClient({
  initialTasks,
  initialTotal,
  initialStats,
}: OutreachDeckClientProps) {
  const [filter, setFilter] = useState("all");

  const filteredTasks = useMemo(() => {
    if (filter === "all") {
      return initialTasks;
    }
    return initialTasks.filter((task) => task.taskType === filter);
  }, [initialTasks, filter]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  return (
    <div className="space-y-8">
      <TaskDeckHeader
        stats={initialStats}
        currentFilter={filter}
        onFilterChange={handleFilterChange}
      />

      <TaskDeck
        initialTasks={filteredTasks}
        initialTotal={filter === "all" ? initialTotal : filteredTasks.length}
        initialPage={1}
      />
    </div>
  );
}
