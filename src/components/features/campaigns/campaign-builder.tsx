"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Workflow } from "lucide-react";
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
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <CardTitle>Campaign Flow</CardTitle>
          </div>
          {steps.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {steps.length} step{steps.length !== 1 ? "s" : ""} in this campaign
            </p>
          )}
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                <Workflow className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Build your campaign flow</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Add steps to create a personalized outreach sequence. Combine emails, gestures, and delays.
              </p>
              <AddStepButton onAddStep={handleAddStep} />
            </div>
          ) : (
            <div className="pl-1">
              {/* Timeline */}
              {steps.map((step, index) => (
                <StepCard
                  key={step.id}
                  step={step}
                  stepNumber={index + 1}
                  onEdit={handleEditStep}
                  onDelete={handleDeleteStep}
                  isDragging={deletingId === step.id}
                  isLast={false}
                  animationDelay={index * 100}
                />
              ))}

              {/* Add step node at end of timeline */}
              <div className="flex gap-4">
                {/* Plus node on timeline */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-background text-muted-foreground hover:border-primary hover:text-primary transition-colors duration-200">
                    <span className="text-lg font-light">+</span>
                  </div>
                </div>
                {/* Add step button */}
                <div className="flex-1 pb-2">
                  <AddStepButton onAddStep={handleAddStep} />
                </div>
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
