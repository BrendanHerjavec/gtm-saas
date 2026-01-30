"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Mail, Gift, Clock } from "lucide-react";
import type { StepType } from "./step-card";

interface AddStepButtonProps {
  onAddStep: (type: StepType) => void;
}

export function AddStepButton({ onAddStep }: AddStepButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (type: StepType) => {
    onAddStep(type);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-dashed border-2 h-11 text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-200"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Step
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-52">
        <DropdownMenuItem
          onClick={() => handleSelect("EMAIL")}
          className="gap-3 py-2.5 cursor-pointer"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">Email</p>
            <p className="text-xs text-muted-foreground">Send an email message</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSelect("GESTURE")}
          className="gap-3 py-2.5 cursor-pointer"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600">
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">Gesture</p>
            <p className="text-xs text-muted-foreground">Send a gift or touch</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSelect("DELAY")}
          className="gap-3 py-2.5 cursor-pointer"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">Delay</p>
            <p className="text-xs text-muted-foreground">Wait before next step</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
