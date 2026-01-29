"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Layers, ListTodo, Shuffle } from "lucide-react";
import {
  DeckGrid,
  CreateDeckDialog,
  RandomDeckDialog,
  TaskDeck,
  TaskDeckHeader,
} from "@/components/features/tasks";
import type { TaskDeckWithCreator } from "@/actions/task-decks";
import type { OutreachTaskWithRecipient } from "@/actions/tasks";

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

interface TasksPageClientProps {
  decks: TaskDeckWithCreator[];
  initialTasks: OutreachTaskWithRecipient[];
  initialTotal: number;
  initialStats: TaskDeckStats | null;
}

export function TasksPageClient({
  decks,
  initialTasks,
  initialTotal,
  initialStats,
}: TasksPageClientProps) {
  const [createDeckOpen, setCreateDeckOpen] = useState(false);
  const [randomDeckOpen, setRandomDeckOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState("all");

  // Filter tasks that don't belong to any deck (loose tasks)
  const looseTasks = useMemo(() => {
    // In demo mode, show all tasks as loose tasks for now
    return initialTasks;
  }, [initialTasks]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === "all") {
      return looseTasks;
    }
    return looseTasks.filter((task) => task.taskType === taskFilter);
  }, [looseTasks, taskFilter]);

  const handleFilterChange = (newFilter: string) => {
    setTaskFilter(newFilter);
  };

  const sealedCount = decks.filter((d) => d.status === "SEALED").length;
  const inProgressCount = decks.filter((d) => d.status === "OPENED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Organize tasks into decks and work through them
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setRandomDeckOpen(true)}>
            <Shuffle className="h-4 w-4 mr-2" />
            Random Pack
          </Button>
          <Button onClick={() => setCreateDeckOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Deck
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="decks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="decks" className="gap-2">
            <Layers className="h-4 w-4" />
            Decks
            {(sealedCount > 0 || inProgressCount > 0) && (
              <Badge variant="secondary" className="ml-1">
                {sealedCount + inProgressCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ListTodo className="h-4 w-4" />
            All Tasks
            {initialStats && initialStats.actionable > 0 && (
              <Badge variant="secondary" className="ml-1">
                {initialStats.actionable}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Decks Tab */}
        <TabsContent value="decks" className="space-y-6">
          <DeckGrid
            decks={decks}
            onCreateClick={() => setCreateDeckOpen(true)}
          />
        </TabsContent>

        {/* Tasks Tab - Shows all tasks (legacy task deck view) */}
        <TabsContent value="tasks" className="space-y-8">
          <TaskDeckHeader
            stats={initialStats}
            currentFilter={taskFilter}
            onFilterChange={handleFilterChange}
          />

          <TaskDeck
            initialTasks={filteredTasks}
            initialTotal={taskFilter === "all" ? initialTotal : filteredTasks.length}
            initialPage={1}
          />
        </TabsContent>
      </Tabs>

      {/* Create Deck Dialog */}
      <CreateDeckDialog
        open={createDeckOpen}
        onOpenChange={setCreateDeckOpen}
      />

      {/* Random Deck Dialog */}
      <RandomDeckDialog
        open={randomDeckOpen}
        onOpenChange={setRandomDeckOpen}
      />
    </div>
  );
}
