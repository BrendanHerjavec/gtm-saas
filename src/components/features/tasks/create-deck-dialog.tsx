"use client";

import { useState, useTransition } from "react";
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
import { Loader2, Layers, Sparkles } from "lucide-react";
import { createTaskDeck } from "@/actions/task-decks";

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

export function CreateDeckDialog({ open, onOpenChange }: CreateDeckDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coverColor: "#3B82F6",
    emoji: "🎯",
  });

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
        });

        // Reset and close
        setFormData({
          name: "",
          description: "",
          coverColor: "#3B82F6",
          emoji: "🎯",
        });
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to create deck:", error);
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({
        name: "",
        description: "",
        coverColor: "#3B82F6",
        emoji: "🎯",
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Create New Deck
          </DialogTitle>
          <DialogDescription>
            Create a task deck to group and organize your tasks. You can add tasks to it later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Preview Card */}
            <div
              className="rounded-lg p-6 text-center"
              style={{ backgroundColor: formData.coverColor }}
            >
              <span className="text-4xl">{formData.emoji}</span>
              <p className="mt-2 font-semibold text-white drop-shadow-sm">
                {formData.name || "Deck Name"}
              </p>
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

            {/* Color Selection */}
            <div className="space-y-2">
              <Label>Cover Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, coverColor: color.value }))
                    }
                    className={`w-8 h-8 rounded-full transition-all ${
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
              <div className="flex gap-2 flex-wrap">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, emoji }))
                    }
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
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

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
