"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Layers,
  Loader2,
  CheckCircle2,
  Video,
  PenLine,
  Gift,
  Calendar,
  Mail,
} from "lucide-react";
import { generateTasksFromCampaign } from "@/actions/tasks";

interface GenerateTasksButtonProps {
  campaignId: string;
  campaignName: string;
  recipientCount: number;
}

const taskTypes = [
  { value: "VIDEO", label: "Record Video", icon: Video, description: "Personalized video messages" },
  { value: "HANDWRITTEN_NOTE", label: "Handwritten Note", icon: PenLine, description: "Personal handwritten notes" },
  { value: "GIFT", label: "Send Gift", icon: Gift, description: "Physical or digital gifts" },
  { value: "EXPERIENCE", label: "Book Experience", icon: Calendar, description: "Meetings, dinners, events" },
  { value: "DIRECT_MAIL", label: "Direct Mail", icon: Mail, description: "Printed materials" },
];

export function GenerateTasksButton({
  campaignId,
  campaignName,
  recipientCount,
}: GenerateTasksButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [taskType, setTaskType] = useState<string>("VIDEO");
  const [result, setResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generateTasksFromCampaign(
        campaignId,
        taskType as "VIDEO" | "HANDWRITTEN_NOTE" | "GIFT" | "EXPERIENCE" | "DIRECT_MAIL"
      );
      setResult(res);
      if (res.success) {
        router.refresh();
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    setTaskType("VIDEO");
  };

  const selectedType = taskTypes.find((t) => t.value === taskType);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Layers className="mr-2 h-4 w-4" />
          Generate Tasks
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Generate Tasks
          </DialogTitle>
          <DialogDescription>
            Create tasks for all {recipientCount} recipients in &ldquo;{campaignName}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="py-6">
            {result.success ? (
              <div className="text-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 w-fit mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Tasks Created!</h3>
                <p className="text-muted-foreground mb-4">
                  Successfully created {result.count} tasks.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                  <Button onClick={() => router.push("/tasks")}>
                    Go to Task Deck
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4 w-fit mx-auto mb-4">
                  <Layers className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Could Not Generate Tasks</h3>
                <p className="text-muted-foreground mb-4">{result.error}</p>
                <Button variant="outline" onClick={() => setResult(null)}>
                  Try Again
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taskType">Task Type</Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedType && (
                  <p className="text-xs text-muted-foreground">{selectedType.description}</p>
                )}
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium text-sm mb-2">What will be created:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {recipientCount} tasks (one per recipient)</li>
                  <li>• Each task will include recipient context</li>
                  <li>• Tasks will be added to your Task Deck</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isPending || recipientCount === 0}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4 mr-2" />
                    Generate {recipientCount} Tasks
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
