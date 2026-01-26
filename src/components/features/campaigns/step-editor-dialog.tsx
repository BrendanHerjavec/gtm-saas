"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { CampaignStep, StepType } from "./step-card";

interface Gesture {
  id: string;
  name: string;
  icon: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
}

interface StepEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: CampaignStep | null;
  stepType: StepType | null;
  gestures: Gesture[];
  onSave: (data: {
    stepType: StepType;
    emailSubject?: string;
    emailContent?: string;
    gestureId?: string;
    gestureNote?: string;
    delayDays?: number;
    delayHours?: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function StepEditorDialog({
  open,
  onOpenChange,
  step,
  stepType,
  gestures,
  onSave,
  isLoading,
}: StepEditorDialogProps) {
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [gestureId, setGestureId] = useState("");
  const [gestureNote, setGestureNote] = useState("");
  const [delayDays, setDelayDays] = useState(0);
  const [delayHours, setDelayHours] = useState(0);

  const currentType = step?.stepType || stepType;

  // Reset form when dialog opens with a step or type
  useEffect(() => {
    if (step) {
      setEmailSubject(step.emailSubject || "");
      setEmailContent(step.emailContent || "");
      setGestureId(step.gestureId || "");
      setGestureNote(step.gestureNote || "");
      setDelayDays(step.delayDays || 0);
      setDelayHours(step.delayHours || 0);
    } else {
      setEmailSubject("");
      setEmailContent("");
      setGestureId("");
      setGestureNote("");
      setDelayDays(1);
      setDelayHours(0);
    }
  }, [step, open]);

  const handleSave = async () => {
    if (!currentType) return;

    await onSave({
      stepType: currentType,
      emailSubject: currentType === "EMAIL" ? emailSubject : undefined,
      emailContent: currentType === "EMAIL" ? emailContent : undefined,
      gestureId: currentType === "GESTURE" ? gestureId : undefined,
      gestureNote: currentType === "GESTURE" ? gestureNote : undefined,
      delayDays: currentType === "DELAY" ? delayDays : undefined,
      delayHours: currentType === "DELAY" ? delayHours : undefined,
    });
  };

  const getTitle = () => {
    const action = step ? "Edit" : "Add";
    switch (currentType) {
      case "EMAIL":
        return `${action} Email Step`;
      case "GESTURE":
        return `${action} Gesture Step`;
      case "DELAY":
        return `${action} Delay Step`;
      default:
        return `${action} Step`;
    }
  };

  const getDescription = () => {
    switch (currentType) {
      case "EMAIL":
        return "Configure the email that will be sent to recipients.";
      case "GESTURE":
        return "Select a gesture from the marketplace to send.";
      case "DELAY":
        return "Add a waiting period before the next step.";
      default:
        return "";
    }
  };

  const isValid = () => {
    switch (currentType) {
      case "EMAIL":
        return emailSubject.trim().length > 0;
      case "GESTURE":
        return gestureId.length > 0;
      case "DELAY":
        return delayDays > 0 || delayHours > 0;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentType === "EMAIL" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter email content..."
                  rows={6}
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                />
              </div>
            </>
          )}

          {currentType === "GESTURE" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="gesture">Gesture</Label>
                <Select value={gestureId} onValueChange={setGestureId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a gesture..." />
                  </SelectTrigger>
                  <SelectContent>
                    {gestures.map((gesture) => (
                      <SelectItem key={gesture.id} value={gesture.id}>
                        {gesture.name} (${gesture.minPrice}-${gesture.maxPrice})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Personalized Note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Add a personal message to include with the gesture..."
                  rows={3}
                  value={gestureNote}
                  onChange={(e) => setGestureNote(e.target.value)}
                />
              </div>
            </>
          )}

          {currentType === "DELAY" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="days">Days</Label>
                <Input
                  id="days"
                  type="number"
                  min={0}
                  value={delayDays}
                  onChange={(e) => setDelayDays(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min={0}
                  max={23}
                  value={delayHours}
                  onChange={(e) => setDelayHours(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {step ? "Update" : "Add"} Step
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
