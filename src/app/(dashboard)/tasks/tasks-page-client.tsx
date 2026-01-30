"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Layers,
  ListTodo,
  Shuffle,
  Trophy,
  Gift,
  PenLine,
  Video,
  Calendar,
  Mail,
  Building2,
  CheckCircle2,
  SkipForward,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  DeckGrid,
  CreateDeckDialog,
  RandomDeckDialog,
  TaskDeckHeader,
  Leaderboard,
  CompleteTaskDialog,
  SkipTaskDialog,
} from "@/components/features/tasks";
import {
  completeOutreachTask,
  skipOutreachTask,
  startOutreachTask,
} from "@/actions/tasks";
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

const taskTypeConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  GIFT: { icon: Gift, label: "Gift", color: "text-orange-600", bgColor: "bg-orange-500/10" },
  HANDWRITTEN_NOTE: { icon: PenLine, label: "Note", color: "text-purple-600", bgColor: "bg-purple-500/10" },
  VIDEO: { icon: Video, label: "Video", color: "text-blue-600", bgColor: "bg-blue-500/10" },
  EXPERIENCE: { icon: Calendar, label: "Experience", color: "text-green-600", bgColor: "bg-green-500/10" },
  DIRECT_MAIL: { icon: Mail, label: "Mail", color: "text-rose-600", bgColor: "bg-rose-500/10" },
};

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
}

export function TasksPageClient({
  decks,
  initialTasks,
  initialTotal,
  initialStats,
}: TasksPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createDeckOpen, setCreateDeckOpen] = useState(false);
  const [randomDeckOpen, setRandomDeckOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState("all");
  const [tasks, setTasks] = useState(initialTasks);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    if (taskFilter === "all") {
      return tasks;
    }
    return tasks.filter((task) => task.taskType === taskFilter);
  }, [tasks, taskFilter]);

  const handleFilterChange = (newFilter: string) => {
    setTaskFilter(newFilter);
  };

  const handleStartTask = (taskId: string) => {
    startTransition(async () => {
      try {
        await startOutreachTask(taskId);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: "IN_PROGRESS" } : t))
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
        await completeOutreachTask({ taskId: selectedTaskId, ...data });
        setTasks((prev) => prev.filter((t) => t.id !== selectedTaskId));
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
        setTasks((prev) => prev.filter((t) => t.id !== selectedTaskId));
        setSkipDialogOpen(false);
        setSelectedTaskId(null);
        router.refresh();
      } catch (error) {
        console.error("Failed to skip task:", error);
      }
    });
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
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Decks Tab */}
        <TabsContent value="decks" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <DeckGrid
              decks={decks}
              onCreateClick={() => setCreateDeckOpen(true)}
            />
            <div className="hidden lg:block">
              <Leaderboard />
            </div>
          </div>
        </TabsContent>

        {/* Tasks Tab - List view of all tasks */}
        <TabsContent value="tasks" className="space-y-6">
          <TaskDeckHeader
            stats={initialStats}
            currentFilter={taskFilter}
            onFilterChange={handleFilterChange}
          />

          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-6 mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">All caught up!</h2>
              <p className="text-muted-foreground max-w-md">
                You&apos;ve completed all your tasks. Great job! Check back later or create new tasks to continue.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const config = taskTypeConfig[task.taskType] || taskTypeConfig.GIFT;
                const TaskIcon = config.icon;
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  task.status === "PENDING";
                const isInProgress = task.status === "IN_PROGRESS";

                return (
                  <Card
                    key={task.id}
                    className={`transition-colors hover:bg-muted/30 ${
                      isInProgress ? "border-blue-200 dark:border-blue-800" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Task type icon */}
                        <div
                          className={`shrink-0 rounded-full p-2.5 ${config.bgColor}`}
                        >
                          <TaskIcon className={`h-4 w-4 ${config.color}`} />
                        </div>

                        {/* Recipient avatar */}
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="text-sm bg-primary/10">
                            {getInitials(
                              task.recipient.firstName,
                              task.recipient.lastName
                            )}
                          </AvatarFallback>
                        </Avatar>

                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {task.recipient.firstName} {task.recipient.lastName}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs shrink-0 ${config.color}`}
                            >
                              {config.label}
                            </Badge>
                            {isInProgress && (
                              <Badge
                                variant="default"
                                className="text-xs bg-blue-600 shrink-0"
                              >
                                In Progress
                              </Badge>
                            )}
                            {isOverdue && (
                              <Badge
                                variant="destructive"
                                className="text-xs shrink-0"
                              >
                                <AlertCircle className="h-3 w-3 mr-0.5" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {task.recipient.company && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                                <Building2 className="h-3 w-3 shrink-0" />
                                {task.recipient.company}
                              </span>
                            )}
                            {task.title && (
                              <span className="text-sm text-muted-foreground truncate hidden sm:inline">
                                {task.title}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Due date */}
                        {task.dueDate && (
                          <div className="hidden md:flex items-center text-xs text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {task.status === "PENDING" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartTask(task.id)}
                              disabled={isPending}
                              className="text-xs"
                            >
                              Start
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSkipClick(task.id)}
                            disabled={isPending}
                          >
                            <SkipForward className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCompleteClick(task.id)}
                            disabled={isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Done
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {isPending && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Leaderboard Tab - Full leaderboard view */}
        <TabsContent value="leaderboard">
          <div className="max-w-2xl mx-auto">
            <Leaderboard />
          </div>
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
