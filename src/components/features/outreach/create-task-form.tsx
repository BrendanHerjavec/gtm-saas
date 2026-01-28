"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Gift,
  PenLine,
  Video,
  Calendar,
  Mail,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { createOutreachTask } from "@/actions/outreach-tasks";
import type { CreateOutreachTaskInput } from "@/lib/validations";

interface Recipient {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  jobTitle: string | null;
}

interface CreateTaskFormProps {
  recipients: Recipient[];
}

const taskTypes = [
  { value: "VIDEO", label: "Record Video", icon: Video, description: "Create a personalized video message" },
  { value: "HANDWRITTEN_NOTE", label: "Handwritten Note", icon: PenLine, description: "Send a handwritten note" },
  { value: "GIFT", label: "Send Gift", icon: Gift, description: "Select and send a gift" },
  { value: "EXPERIENCE", label: "Book Experience", icon: Calendar, description: "Arrange an experience or meeting" },
  { value: "DIRECT_MAIL", label: "Direct Mail", icon: Mail, description: "Send physical mail" },
];

export function CreateTaskForm({ recipients }: CreateTaskFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    recipientId: "",
    taskType: "",
    title: "",
    description: "",
    context: "",
    priority: "3",
    dueDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.recipientId) newErrors.recipientId = "Recipient is required";
    if (!formData.taskType) newErrors.taskType = "Task type is required";
    if (!formData.title) newErrors.title = "Title is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      try {
        const input: CreateOutreachTaskInput = {
          recipientId: formData.recipientId,
          taskType: formData.taskType as CreateOutreachTaskInput["taskType"],
          title: formData.title,
          description: formData.description || undefined,
          context: formData.context || undefined,
          priority: parseInt(formData.priority, 10),
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        };

        await createOutreachTask(input);
        router.push("/outreach");
      } catch (error) {
        console.error("Failed to create task:", error);
        setErrors({ submit: "Failed to create task. Please try again." });
      }
    });
  };

  const selectedRecipient = recipients.find((r) => r.id === formData.recipientId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back Link */}
      <Link
        href="/outreach"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Outreach Deck
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Main Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recipient Select */}
              <div className="space-y-2">
                <Label htmlFor="recipientId">Recipient *</Label>
                <Select
                  value={formData.recipientId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, recipientId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        {recipient.firstName} {recipient.lastName}
                        {recipient.company && ` - ${recipient.company}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.recipientId && (
                  <p className="text-sm text-destructive">{errors.recipientId}</p>
                )}
              </div>

              {/* Task Type Select */}
              <div className="space-y-2">
                <Label>Task Type *</Label>
                <div className="grid grid-cols-1 gap-2">
                  {taskTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.taskType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, taskType: type.value }))
                        }
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/50"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.taskType && (
                  <p className="text-sm text-destructive">{errors.taskType}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Record personalized intro video"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about what needs to be done..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Context & Settings */}
        <div className="space-y-6">
          {/* Selected Recipient Preview */}
          {selectedRecipient && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Selected Recipient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">
                    {selectedRecipient.firstName} {selectedRecipient.lastName}
                  </p>
                  {selectedRecipient.jobTitle && (
                    <p className="text-sm text-muted-foreground">{selectedRecipient.jobTitle}</p>
                  )}
                  {selectedRecipient.company && (
                    <p className="text-sm text-muted-foreground">{selectedRecipient.company}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{selectedRecipient.email}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Context & Talking Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="context">Context</Label>
                <Textarea
                  id="context"
                  placeholder="Add talking points, notes, or context for this outreach..."
                  value={formData.context}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, context: e.target.value }))
                  }
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  This will be displayed on the task card to help guide the outreach.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">High</SelectItem>
                    <SelectItem value="3">Medium</SelectItem>
                    <SelectItem value="1">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <p className="text-sm text-destructive text-center">{errors.submit}</p>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Task"
          )}
        </Button>
      </div>
    </form>
  );
}
