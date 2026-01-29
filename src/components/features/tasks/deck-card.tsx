"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Layers,
  MoreVertical,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import type { TaskDeckWithCreator } from "@/actions/task-decks";

interface DeckCardProps {
  deck: TaskDeckWithCreator;
  onOpen?: (deckId: string) => void;
  onDelete?: (deckId: string) => void;
  onContinue?: (deckId: string) => void;
}

export function DeckCard({ deck, onOpen, onDelete, onContinue }: DeckCardProps) {
  const isSealed = deck.status === "SEALED";
  const isOpened = deck.status === "OPENED";
  const isCompleted = deck.status === "COMPLETED";

  const progress = deck.totalTasks > 0
    ? Math.round(((deck.completedTasks + deck.skippedTasks) / deck.totalTasks) * 100)
    : 0;

  const remainingTasks = deck.totalTasks - deck.completedTasks - deck.skippedTasks;

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isSealed ? "cursor-pointer hover:scale-[1.02]" : ""
      }`}
      onClick={() => isSealed && onOpen?.(deck.id)}
    >
      {/* Colored Header */}
      <div
        className="h-24 relative"
        style={{ backgroundColor: deck.coverColor || "#3B82F6" }}
      >
        {/* Shine effect for sealed packs */}
        {isSealed && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
        )}

        {/* Emoji */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl drop-shadow-lg">{deck.emoji || "📦"}</span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {isSealed && (
            <Badge className="bg-white/90 text-gray-800 shadow-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              Sealed
            </Badge>
          )}
          {isOpened && (
            <Badge className="bg-blue-500 text-white shadow-sm">
              <Play className="h-3 w-3 mr-1" />
              In Progress
            </Badge>
          )}
          {isCompleted && (
            <Badge className="bg-green-500 text-white shadow-sm">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>

        {/* Menu */}
        <div className="absolute top-2 left-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(deck.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Deck
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg truncate">{deck.name}</h3>
          {deck.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {deck.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            <span>{deck.totalTasks} tasks</span>
          </div>
          {!isSealed && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{deck.completedTasks} done</span>
            </div>
          )}
        </div>

        {/* Progress bar for opened decks */}
        {!isSealed && deck.totalTasks > 0 && (
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {progress}% complete
            </p>
          </div>
        )}

        {/* Action Button */}
        <div onClick={(e) => e.stopPropagation()}>
          {isSealed && (
            <Button
              className="w-full"
              onClick={() => onOpen?.(deck.id)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Open Deck
            </Button>
          )}
          {isOpened && (
            <Button
              className="w-full"
              onClick={() => onContinue?.(deck.id)}
            >
              <Play className="h-4 w-4 mr-2" />
              Continue ({remainingTasks} remaining)
            </Button>
          )}
          {isCompleted && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onContinue?.(deck.id)}
            >
              <Clock className="h-4 w-4 mr-2" />
              View Summary
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
