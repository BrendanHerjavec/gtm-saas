"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  PenLine,
  Video,
  Calendar,
  Mail,
  Layers,
  Plus,
  Filter,
} from "lucide-react";
import Link from "next/link";

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

interface TaskDeckHeaderProps {
  stats: TaskDeckStats | null;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
}

const filterOptions = [
  { value: "all", label: "All Tasks", icon: Layers },
  { value: "VIDEO", label: "Videos", icon: Video },
  { value: "HANDWRITTEN_NOTE", label: "Notes", icon: PenLine },
  { value: "GIFT", label: "Gifts", icon: Gift },
  { value: "EXPERIENCE", label: "Experiences", icon: Calendar },
  { value: "DIRECT_MAIL", label: "Mail", icon: Mail },
];

export function TaskDeckHeader({ stats, currentFilter, onFilterChange }: TaskDeckHeaderProps) {
  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{stats.actionable}</span>
            <span className="text-muted-foreground">tasks to complete</span>
          </div>
          {stats.inProgress > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {stats.inProgress} in progress
            </Badge>
          )}
        </div>
        <Link href="/outreach/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </Link>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filterOptions.map((option) => {
          const Icon = option.icon;
          const count =
            option.value === "all"
              ? stats.actionable
              : stats.byType[option.value as keyof typeof stats.byType] || 0;
          const isActive = currentFilter === option.value;

          return (
            <Button
              key={option.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(option.value)}
              className="gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
              {count > 0 && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-1 text-xs h-5 min-w-[20px] justify-center"
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
