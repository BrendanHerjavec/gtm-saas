"use client";

import { useState } from "react";
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
import { Loader2, CheckCircle2 } from "lucide-react";
import type { OutreachTaskWithRecipient } from "@/actions/outreach-tasks";

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: OutreachTaskWithRecipient;
  onConfirm: (data: {
    message?: string;
    videoUrl?: string;
    giftItemId?: string;
    notes?: string;
  }) => void;
  isLoading?: boolean;
}

export function CompleteTaskDialog({
  open,
  onOpenChange,
  task,
  onConfirm,
  isLoading,
}: CompleteTaskDialogProps) {
  const [message, setMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      message: message || undefined,
      videoUrl: videoUrl || undefined,
      notes: notes || undefined,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setMessage("");
      setVideoUrl("");
      setNotes("");
    }
    onOpenChange(newOpen);
  };

  const showVideoField = task?.taskType === "VIDEO";
  const showMessageField = ["HANDWRITTEN_NOTE", "GIFT", "EXPERIENCE", "DIRECT_MAIL"].includes(
    task?.taskType || ""
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Complete Task
          </DialogTitle>
          <DialogDescription>
            Add any details about the completed outreach before marking it done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {showVideoField && (
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://loom.com/share/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Link to the recorded video (Loom, YouTube, etc.)
                </p>
              </div>
            )}

            {showMessageField && (
              <div className="space-y-2">
                <Label htmlFor="message">Message Sent</Label>
                <Textarea
                  id="message"
                  placeholder="What message did you send?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this outreach..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Task
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
