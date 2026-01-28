"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Gift,
  PenLine,
  Video,
  Calendar,
  Mail,
  Phone,
  Linkedin,
  Building2,
  Briefcase,
  Clock,
  ChevronRight,
  CheckCircle2,
  SkipForward,
  AlertCircle,
} from "lucide-react";
import type { OutreachTaskWithRecipient } from "@/actions/tasks";

interface TaskCardProps {
  task: OutreachTaskWithRecipient;
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string) => void;
  onStart?: (taskId: string) => void;
  isLoading?: boolean;
}

const taskTypeConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  GIFT: {
    icon: Gift,
    label: "Send Gift",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  HANDWRITTEN_NOTE: {
    icon: PenLine,
    label: "Handwritten Note",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  VIDEO: {
    icon: Video,
    label: "Record Video",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  EXPERIENCE: {
    icon: Calendar,
    label: "Book Experience",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  DIRECT_MAIL: {
    icon: Mail,
    label: "Direct Mail",
    color: "text-rose-600",
    bgColor: "bg-rose-500/10",
  },
};

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
}

function parseContext(contextStr: string | null): Record<string, unknown> | null {
  if (!contextStr) return null;
  try {
    return JSON.parse(contextStr);
  } catch {
    return null;
  }
}

export function TaskCard({ task, onComplete, onSkip, onStart, isLoading }: TaskCardProps) {
  const config = taskTypeConfig[task.taskType] || taskTypeConfig.GIFT;
  const TaskIcon = config.icon;
  const recipient = task.recipient;
  const context = parseContext(task.context);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status === "PENDING";
  const isPending = task.status === "PENDING";
  const isInProgress = task.status === "IN_PROGRESS";

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-2 overflow-hidden">
      {/* Task Type Header */}
      <div className={`${config.bgColor} px-6 py-4 border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 bg-white/80 ${config.color}`}>
              <TaskIcon className="h-5 w-5" />
            </div>
            <div>
              <Badge variant="secondary" className="text-xs font-medium">
                {config.label}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
              {isInProgress && (
                <Badge variant="default" className="ml-2 text-xs bg-blue-600">
                  In Progress
                </Badge>
              )}
            </div>
          </div>
          {task.dueDate && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Due {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6">
        {/* Recipient Info */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-16 w-16 border-2 border-muted">
            <AvatarFallback className="text-lg font-semibold bg-primary/10">
              {getInitials(recipient.firstName, recipient.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">
              {recipient.firstName} {recipient.lastName}
            </h2>
            {recipient.jobTitle && (
              <div className="flex items-center text-muted-foreground mt-1">
                <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{recipient.jobTitle}</span>
              </div>
            )}
            {recipient.company && (
              <div className="flex items-center text-muted-foreground mt-1">
                <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{recipient.company}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b">
          {recipient.email && (
            <a
              href={`mailto:${recipient.email}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
              {recipient.email}
            </a>
          )}
          {recipient.phone && (
            <a
              href={`tel:${recipient.phone}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="h-4 w-4" />
              {recipient.phone}
            </a>
          )}
          {recipient.linkedinUrl && (
            <a
              href={recipient.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          )}
        </div>

        {/* Task Details */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
          {task.description && (
            <p className="text-muted-foreground">{task.description}</p>
          )}
        </div>

        {/* Context/Talking Points */}
        {context && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              Context & Talking Points
            </h4>
            <div className="space-y-2 text-sm">
              {context.talkingPoints && Array.isArray(context.talkingPoints) && (
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {(context.talkingPoints as string[]).map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              )}
              {context.recentActivity && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Recent Activity:</span>{" "}
                  {context.recentActivity as string}
                </p>
              )}
              {context.dealValue && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Deal Value:</span>{" "}
                  {context.dealValue as string}
                </p>
              )}
              {context.recentNews && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Recent News:</span>{" "}
                  {context.recentNews as string}
                </p>
              )}
              {context.personalNote && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Note:</span>{" "}
                  {context.personalNote as string}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recipient Notes */}
        {recipient.notes && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4 mb-6 border border-yellow-200 dark:border-yellow-900">
            <h4 className="font-medium text-sm mb-2 text-yellow-800 dark:text-yellow-200">
              Notes about {recipient.firstName}
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">{recipient.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          {isPending && onStart && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onStart(task.id)}
              disabled={isLoading}
            >
              Start Task
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onSkip(task.id)}
            disabled={isLoading}
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip
          </Button>
          <Button
            className="flex-1"
            onClick={() => onComplete(task.id)}
            disabled={isLoading}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
