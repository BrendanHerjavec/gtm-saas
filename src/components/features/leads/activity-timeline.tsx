"use client";

import {
  FileText,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  Linkedin,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateTime, getInitials } from "@/lib/utils";

type ActivityType = "NOTE" | "EMAIL" | "CALL" | "MEETING" | "TASK" | "LINKEDIN_MESSAGE";

type Activity = {
  id: string;
  type: string;
  subject: string | null;
  description: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

interface ActivityTimelineProps {
  activities: Activity[];
}

const activityIcons: Record<string, React.ReactNode> = {
  NOTE: <FileText className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  CALL: <Phone className="h-4 w-4" />,
  MEETING: <Calendar className="h-4 w-4" />,
  TASK: <CheckSquare className="h-4 w-4" />,
  LINKEDIN_MESSAGE: <Linkedin className="h-4 w-4" />,
};

const activityLabels: Record<string, string> = {
  NOTE: "added a note",
  EMAIL: "sent an email",
  CALL: "logged a call",
  MEETING: "scheduled a meeting",
  TASK: "created a task",
  LINKEDIN_MESSAGE: "sent a LinkedIn message",
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative flex gap-4">
          {index < activities.length - 1 && (
            <div className="absolute left-5 top-10 h-full w-px bg-border" />
          )}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background">
            {activityIcons[activity.type] || <FileText className="h-4 w-4" />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={activity.user.image || ""} />
                <AvatarFallback className="text-xs">
                  {getInitials(activity.user.name || "")}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{activity.user.name}</span>
              <span className="text-muted-foreground">
                {activityLabels[activity.type] || activity.type.toLowerCase()}
              </span>
            </div>
            {activity.subject && (
              <p className="font-medium">{activity.subject}</p>
            )}
            {activity.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {activity.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDateTime(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
