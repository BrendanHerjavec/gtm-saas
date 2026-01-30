"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Layers,
  Sparkles,
  Search,
  ListChecks,
  Clock,
  Gift,
  Mail,
  Video,
  PenTool,
  Send,
  CheckSquare,
  Square,
} from "lucide-react";
import { createTaskDeck } from "@/actions/task-decks";
import { getUnassignedTasks, getTasksDueSoon } from "@/actions/task-decks";

interface TaskForSelection {
  id: string;
  title: string;
  taskType: string;
  status: string;
  dueDate?: Date | string | null;
  recipient?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    jobTitle: string | null;
  } | null;
}

interface CreateDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const colorOptions = [
  { value: "#3B82F6", name: "Blue" },
  { value: "#10B981", name: "Green" },
  { value: "#8B5CF6", name: "Purple" },
  { value: "#F59E0B", name: "Orange" },
  { value: "#EF4444", name: "Red" },
  { value: "#EC4899", name: "Pink" },
  { value: "#06B6D4", name: "Cyan" },
  { value: "#6366F1", name: "Indigo" },
];

const emojiOptions = ["🎯", "🚀", "💼", "🤝", "💡", "⭐", "🎁", "📧", "🎥", "✉️", "🏆", "💪"];

const taskTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  GIFT: { icon: Gift, color: "bg-emerald-100 text-emerald-700", label: "Gift" },
  HANDWRITTEN_NOTE: { icon: PenTool, color: "bg-purple-100 text-purple-700", label: "Note" },
  VIDEO: { icon: Video, color: "bg-blue-100 text-blue-700", label: "Video" },
  EXPERIENCE: { icon: Sparkles, color: "bg-amber-100 text-amber-700", label: "Experience" },
  DIRECT_MAIL: { icon: Send, color: "bg-rose-100 text-rose-700", label: "Mail" },
  EMAIL: { icon: Mail, color: "bg-sky-100 text-sky-700", label: "Email" },
};

type TaskTab = "select" | "due-soon";

export function CreateDeckDialog({ open, onOpenChange }: CreateDeckDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coverColor: "#3B82F6",
    emoji: "🎯",
  });

  // Task selection state
  const [taskTab, setTaskTab] = useState<TaskTab>("select");
  const [allTasks, setAllTasks] = useState<TaskForSelection[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [dueDays, setDueDays] = useState<number>(7);
  const [dueSoonTasks, setDueSoonTasks] = useState<TaskForSelection[]>([]);
  const [loadingDueSoon, setLoadingDueSoon] = useState(false);

  // Load unassigned tasks when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingTasks(true);
      getUnassignedTasks()
        .then((result) => {
          setAllTasks(result.tasks as TaskForSelection[]);
        })
        .catch(console.error)
        .finally(() => setLoadingTasks(false));
    }
  }, [open]);

  // Load due soon tasks when tab switches or days change
  const fetchDueSoon = useCallback(async (days: number) => {
    setLoadingDueSoon(true);
    try {
      const result = await getTasksDueSoon(days);
      setDueSoonTasks(result.tasks as TaskForSelection[]);
      // Auto-select all due-soon tasks
      const ids = new Set(result.tasks.map((t: TaskForSelection) => t.id));
      setSelectedTaskIds(ids);
    } catch (error) {
      console.error("Failed to fetch due-soon tasks:", error);
    } finally {
      setLoadingDueSoon(false);
    }
  }, []);

  useEffect(() => {
    if (open && taskTab === "due-soon") {
      fetchDueSoon(dueDays);
    }
  }, [open, taskTab, dueDays, fetchDueSoon]);

  const filteredTasks = allTasks.filter((task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const recipientName = [task.recipient?.firstName, task.recipient?.lastName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      recipientName.includes(q) ||
      (task.recipient?.company || "").toLowerCase().includes(q)
    );
  });

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const tasks = taskTab === "select" ? filteredTasks : dueSoonTasks;
    setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
  };

  const deselectAll = () => {
    setSelectedTaskIds(new Set());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    startTransition(async () => {
      try {
        await createTaskDeck({
          name: formData.name,
          description: formData.description || undefined,
          coverColor: formData.coverColor,
          emoji: formData.emoji,
          taskIds: selectedTaskIds.size > 0 ? Array.from(selectedTaskIds) : undefined,
        });

        // Reset and close
        resetForm();
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to create deck:", error);
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      coverColor: "#3B82F6",
      emoji: "🎯",
    });
    setSelectedTaskIds(new Set());
    setSearchQuery("");
    setTaskTab("select");
    setDueDays(7);
    setDueSoonTasks([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const getRecipientName = (task: TaskForSelection) => {
    if (!task.recipient) return "Unknown";
    return [task.recipient.firstName, task.recipient.lastName].filter(Boolean).join(" ") || task.recipient.email;
  };

  const formatDueDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays}d`;
  };

  const currentTasks = taskTab === "select" ? filteredTasks : dueSoonTasks;
  const isAllSelected = currentTasks.length > 0 && currentTasks.every((t) => selectedTaskIds.has(t.id));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Create New Deck
          </DialogTitle>
          <DialogDescription>
            Create a task deck and optionally add tasks to it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
            {/* Preview Card */}
            <div
              className="rounded-lg p-5 text-center"
              style={{ backgroundColor: formData.coverColor }}
            >
              <span className="text-3xl">{formData.emoji}</span>
              <p className="mt-1.5 font-semibold text-white drop-shadow-sm text-sm">
                {formData.name || "Deck Name"}
              </p>
              {selectedTaskIds.size > 0 && (
                <p className="text-white/80 text-xs mt-0.5">
                  {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Deck Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Q1 Enterprise Outreach"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this deck for?"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
              />
            </div>

            {/* Color & Emoji in a row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Color Selection */}
              <div className="space-y-2">
                <Label>Cover Color</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, coverColor: color.value }))
                      }
                      className={`w-7 h-7 rounded-full transition-all ${
                        formData.coverColor === color.value
                          ? "ring-2 ring-offset-2 ring-primary scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Emoji Selection */}
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, emoji }))
                      }
                      className={`w-8 h-8 rounded-md text-base flex items-center justify-center transition-all ${
                        formData.emoji === emoji
                          ? "bg-primary/20 ring-2 ring-primary scale-110"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t pt-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Add Tasks
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
            </div>

            {/* Task tab selector */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={taskTab === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTaskTab("select");
                  setSelectedTaskIds(new Set());
                }}
                className="flex-1"
              >
                <ListChecks className="h-4 w-4 mr-1.5" />
                Select Tasks
              </Button>
              <Button
                type="button"
                variant={taskTab === "due-soon" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTaskTab("due-soon");
                }}
                className="flex-1"
              >
                <Clock className="h-4 w-4 mr-1.5" />
                Due Soon
              </Button>
            </div>

            {/* Select Tasks Tab */}
            {taskTab === "select" && (
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by task, recipient, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Select all / Deselect all */}
                {filteredTasks.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} available
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={isAllSelected ? deselectAll : selectAll}
                      className="h-7 text-xs"
                    >
                      {isAllSelected ? (
                        <>
                          <Square className="h-3 w-3 mr-1" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-3 w-3 mr-1" />
                          Select All
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Task list */}
                <div className="max-h-[200px] overflow-y-auto space-y-1 rounded-md border p-1">
                  {loadingTasks ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading tasks...
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {searchQuery ? "No tasks match your search" : "No unassigned tasks available"}
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        selected={selectedTaskIds.has(task.id)}
                        onToggle={() => toggleTask(task.id)}
                        getRecipientName={getRecipientName}
                        formatDueDate={formatDueDate}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Due Soon Tab */}
            {taskTab === "due-soon" && (
              <div className="space-y-3">
                {/* Duration presets */}
                <div className="space-y-2">
                  <Label className="text-sm">Tasks due within:</Label>
                  <div className="flex gap-2">
                    {[3, 7, 14, 30].map((days) => (
                      <Button
                        key={days}
                        type="button"
                        variant={dueDays === days ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDueDays(days)}
                        className="flex-1"
                      >
                        {days}d
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Select all / Deselect all */}
                {dueSoonTasks.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {dueSoonTasks.length} task{dueSoonTasks.length !== 1 ? "s" : ""} due within {dueDays} days
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={isAllSelected ? deselectAll : selectAll}
                      className="h-7 text-xs"
                    >
                      {isAllSelected ? (
                        <>
                          <Square className="h-3 w-3 mr-1" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-3 w-3 mr-1" />
                          Select All
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Task list */}
                <div className="max-h-[200px] overflow-y-auto space-y-1 rounded-md border p-1">
                  {loadingDueSoon ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Finding tasks...
                    </div>
                  ) : dueSoonTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No tasks due within {dueDays} days
                    </div>
                  ) : (
                    dueSoonTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        selected={selectedTaskIds.has(task.id)}
                        onToggle={() => toggleTask(task.id)}
                        getRecipientName={getRecipientName}
                        formatDueDate={formatDueDate}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 mt-2">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-muted-foreground">
                {selectedTaskIds.size > 0
                  ? `${selectedTaskIds.size} task${selectedTaskIds.size !== 1 ? "s" : ""} selected`
                  : "No tasks selected"}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !formData.name.trim()}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Deck
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Individual task row component
function TaskRow({
  task,
  selected,
  onToggle,
  getRecipientName,
  formatDueDate,
}: {
  task: TaskForSelection;
  selected: boolean;
  onToggle: () => void;
  getRecipientName: (task: TaskForSelection) => string;
  formatDueDate: (date: Date | string | null | undefined) => string | null;
}) {
  const typeConfig = taskTypeConfig[task.taskType] || taskTypeConfig.GIFT;
  const TypeIcon = typeConfig.icon;
  const dueDateLabel = formatDueDate(task.dueDate);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${
        selected
          ? "bg-primary/10 hover:bg-primary/15"
          : "hover:bg-muted/50"
      }`}
    >
      <Checkbox checked={selected} className="pointer-events-none" />
      <div className={`flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 ${typeConfig.color}`}>
        <TypeIcon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {getRecipientName(task)}
          {task.recipient?.company ? ` · ${task.recipient.company}` : ""}
        </p>
      </div>
      {dueDateLabel && (
        <Badge
          variant="outline"
          className={`text-[10px] flex-shrink-0 ${
            dueDateLabel === "Overdue" ? "text-red-600 border-red-200 bg-red-50" : ""
          }`}
        >
          {dueDateLabel}
        </Badge>
      )}
    </button>
  );
}
