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
        <Button variant="outline" className="w-full border-dashed">
          <Plus className="mr-2 h-4 w-4" />
          Add Step
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-48">
        <DropdownMenuItem onClick={() => handleSelect("EMAIL")}>
          <Mail className="mr-2 h-4 w-4 text-blue-600" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("GESTURE")}>
          <Gift className="mr-2 h-4 w-4 text-primary" />
          Gesture
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("DELAY")}>
          <Clock className="mr-2 h-4 w-4 text-gray-600" />
          Delay
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
