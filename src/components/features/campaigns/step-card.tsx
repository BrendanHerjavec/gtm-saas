"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Gift,
  Clock,
  GripVertical,
  Trash2,
  Edit2,
  TreePine,
  Leaf,
  Heart,
  Coffee,
  Pizza,
  Cookie,
  CreditCard,
  Sparkles,
  Flower2,
  Dumbbell,
  Palette,
  BookOpen,
  PenTool,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Icon mapping for gestures
const iconMap: Record<string, LucideIcon> = {
  TreePine,
  Leaf,
  Heart,
  Coffee,
  Pizza,
  Cookie,
  Gift,
  CreditCard,
  Sparkles,
  Flower2,
  Dumbbell,
  Palette,
  BookOpen,
  PenTool,
};

export type StepType = "EMAIL" | "GESTURE" | "DELAY";

export interface CampaignStep {
  id: string;
  stepType: StepType;
  stepOrder: number;
  emailSubject?: string | null;
  emailContent?: string | null;
  gestureId?: string | null;
  gestureNote?: string | null;
  delayDays?: number | null;
  delayHours?: number | null;
  gesture?: {
    id: string;
    name: string;
    icon: string;
    minPrice: number;
    maxPrice: number;
    currency: string;
  } | null;
}

interface StepCardProps {
  step: CampaignStep;
  onEdit?: (step: CampaignStep) => void;
  onDelete?: (stepId: string) => void;
  isDragging?: boolean;
}

export function StepCard({ step, onEdit, onDelete, isDragging }: StepCardProps) {
  const getStepIcon = () => {
    switch (step.stepType) {
      case "EMAIL":
        return <Mail className="h-5 w-5" />;
      case "GESTURE":
        if (step.gesture?.icon) {
          const GestureIcon = iconMap[step.gesture.icon] || Gift;
          return <GestureIcon className="h-5 w-5" />;
        }
        return <Gift className="h-5 w-5" />;
      case "DELAY":
        return <Clock className="h-5 w-5" />;
      default:
        return <HelpCircle className="h-5 w-5" />;
    }
  };

  const getStepTitle = () => {
    switch (step.stepType) {
      case "EMAIL":
        return step.emailSubject || "Email Step";
      case "GESTURE":
        return step.gesture?.name || "Gesture Step";
      case "DELAY":
        const days = step.delayDays || 0;
        const hours = step.delayHours || 0;
        if (days > 0 && hours > 0) {
          return `Wait ${days} day${days > 1 ? "s" : ""} ${hours} hour${hours > 1 ? "s" : ""}`;
        } else if (days > 0) {
          return `Wait ${days} day${days > 1 ? "s" : ""}`;
        } else if (hours > 0) {
          return `Wait ${hours} hour${hours > 1 ? "s" : ""}`;
        }
        return "Delay Step";
      default:
        return "Unknown Step";
    }
  };

  const getStepDescription = () => {
    switch (step.stepType) {
      case "EMAIL":
        return step.emailContent
          ? step.emailContent.substring(0, 100) + (step.emailContent.length > 100 ? "..." : "")
          : "No content yet";
      case "GESTURE":
        return step.gestureNote || (step.gesture ? `Send ${step.gesture.name}` : "Select a gesture");
      case "DELAY":
        return "Pause before the next step";
      default:
        return "";
    }
  };

  const getStepColor = () => {
    switch (step.stepType) {
      case "EMAIL":
        return "bg-blue-500/10 text-blue-600";
      case "GESTURE":
        return "bg-green-800/10 text-green-800";
      case "DELAY":
        return "bg-gray-500/10 text-gray-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getBadgeVariant = () => {
    switch (step.stepType) {
      case "EMAIL":
        return "default";
      case "GESTURE":
        return "secondary";
      case "DELAY":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card
      className={`transition-all ${isDragging ? "shadow-lg ring-2 ring-primary" : "hover:shadow-md"}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="cursor-grab text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </div>

          <div className={`rounded-lg p-2 ${getStepColor()}`}>
            {getStepIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{getStepTitle()}</h4>
              <Badge variant={getBadgeVariant() as "default" | "secondary" | "outline"} className="text-xs">
                {step.stepType}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {getStepDescription()}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(step)}
                className="h-8 w-8"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(step.id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
