"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDown, Loader2 } from "lucide-react";
import { StepCard, type CampaignStep, type StepType } from "./step-card";
import { AddStepButton } from "./add-step-button";
import { StepEditorDialog } from "./step-editor-dialog";
import {
  createCampaignStep,
  updateCampaignStep,
  deleteCampaignStep,
} from "@/actions/campaign-steps";

interface Gesture {
  id: string;
  name: string;
  icon: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
}

interface CampaignBuilderProps {
  campaignId: string;
  campaignName: string;
  initialSteps: CampaignStep[];
  gestures: Gesture[];
}

export function CampaignBuilder({
  campaignId,
  campaignName,
  initialSteps,
  gestures,
}: CampaignBuilderProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<CampaignStep[]>(initialSteps);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<CampaignStep | null>(null);
  const [newStepType, setNewStepType] = useState<StepType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddStep = (type: StepType) => {
    setEditingStep(null);
    setNewStepType(type);
    setDialogOpen(true);
  };

  const handleEditStep = (step: CampaignStep) => {
    setEditingStep(step);
    setNewStepType(null);
    setDialogOpen(true);
  };

  const handleDeleteStep = async (stepId: string) => {
    setDeletingId(stepId);
    try {
      await deleteCampaignStep(stepId);
      setSteps(steps.filter((s) => s.id !== stepId));
      router.refresh();
    } catch (error) {
      console.error("Failed to delete step:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveStep = async (data: {
    stepType: StepType;
    emailSubject?: string;
    emailContent?: string;
    gestureId?: string;
    gestureNote?: string;
    delayDays?: number;
    delayHours?: number;
  }) => {
    setIsLoading(true);
    try {
      if (editingStep) {
        // Update existing step
        const updated = await updateCampaignStep(editingStep.id, data);
        setSteps(steps.map((s) => (s.id === editingStep.id ? updated : s)));
      } else {
        // Create new step
        const newStep = await createCampaignStep(campaignId, {
          ...data,
          stepOrder: steps.length + 1,
        });
        setSteps([...steps, newStep]);
      }
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to save step:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Flow</CardTitle>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No steps yet. Add your first step to build the campaign flow.
              </p>
              <AddStepButton onAddStep={handleAddStep} />
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id}>
                  <StepCard
                    step={step}
                    onEdit={handleEditStep}
                    onDelete={handleDeleteStep}
                    isDragging={deletingId === step.id}
                  />
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4">
                <AddStepButton onAddStep={handleAddStep} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <StepEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        step={editingStep}
        stepType={newStepType}
        gestures={gestures}
        onSave={handleSaveStep}
        isLoading={isLoading}
      />
    </div>
  );
}
