"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Gift,
  Clock,
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
  stepType: string;
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
  stepNumber: number;
  onEdit?: (step: CampaignStep) => void;
  onDelete?: (stepId: string) => void;
  isDragging?: boolean;
  isLast?: boolean;
  animationDelay?: number;
}

const stepConfig = {
  EMAIL: {
    gradient: "from-blue-400 to-blue-600",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
    nodeRing: "ring-blue-200 bg-blue-500",
    label: "Email",
  },
  GESTURE: {
    gradient: "from-emerald-400 to-emerald-600",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    nodeRing: "ring-emerald-200 bg-emerald-500",
    label: "Gesture",
  },
  DELAY: {
    gradient: "from-gray-300 to-gray-500",
    bgLight: "bg-gray-50",
    textColor: "text-gray-500",
    borderColor: "border-gray-200",
    nodeRing: "ring-gray-200 bg-gray-400",
    label: "Delay",
  },
} as const;

export function StepCard({
  step,
  stepNumber,
  onEdit,
  onDelete,
  isDragging,
  isLast,
  animationDelay = 0,
}: StepCardProps) {
  const config = stepConfig[step.stepType as keyof typeof stepConfig] || stepConfig.DELAY;

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

  return (
    <div
      className="flex gap-4 group"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Timeline node */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Step number circle */}
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            text-white text-sm font-bold shadow-md
            ring-4 ${config.nodeRing}
            transition-all duration-300
            group-hover:scale-110 group-hover:shadow-lg
          `}
        >
          {stepNumber}
        </div>
        {/* Connecting line */}
        {!isLast && (
          <div className="w-0.5 flex-1 min-h-[24px] bg-gradient-to-b from-gray-300 to-gray-200 mt-2" />
        )}
      </div>

      {/* Step card */}
      <Card
        className={`
          flex-1 overflow-hidden transition-all duration-300 mb-3
          ${isDragging ? "shadow-xl ring-2 ring-primary scale-[1.02]" : "hover:shadow-lg hover:-translate-y-0.5"}
        `}
      >
        {/* Gradient top accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${config.gradient}`} />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={`
                rounded-xl p-2.5 ${config.bgLight} ${config.textColor}
                transition-transform duration-300 group-hover:scale-105
              `}
            >
              {getStepIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-semibold uppercase tracking-wider ${config.textColor}`}>
                  {config.label}
                </span>
              </div>
              <h4 className="font-semibold text-foreground truncate">
                {getStepTitle()}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {getStepDescription()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(step)}
                  className="h-8 w-8 hover:bg-accent"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(step.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
