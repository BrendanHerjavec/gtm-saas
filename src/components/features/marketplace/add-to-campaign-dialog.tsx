"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { getCampaigns } from "@/actions/campaigns";
import { createCampaignStep } from "@/actions/campaign-steps";
import type { Gesture } from "./gesture-card";

interface Campaign {
  id: string;
  name: string;
  status: string;
}

interface AddToCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gesture: Gesture;
}

export function AddToCampaignDialog({
  open,
  onOpenChange,
  gesture,
}: AddToCampaignDialogProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [gestureNote, setGestureNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // Load campaigns when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoadingCampaigns(true);
      getCampaigns()
        .then((data) => {
          // Filter to only show draft campaigns that can be edited
          const editableCampaigns = data.campaigns.filter(
            (c: Campaign) => c.status === "DRAFT"
          );
          setCampaigns(editableCampaigns);
        })
        .catch(console.error)
        .finally(() => setIsLoadingCampaigns(false));
    }
  }, [open]);

  const handleAdd = async () => {
    if (!selectedCampaignId) return;

    setIsLoading(true);
    try {
      // Get current step count to determine order
      await createCampaignStep(selectedCampaignId, {
        stepType: "GESTURE",
        stepOrder: 999, // Will be reordered by the action
        gestureId: gesture.id,
        gestureNote: gestureNote.trim() || undefined,
      });

      onOpenChange(false);
      setSelectedCampaignId("");
      setGestureNote("");

      // Navigate to the campaign builder
      router.push(`/campaigns/${selectedCampaignId}/edit`);
    } catch (error) {
      console.error("Failed to add gesture to campaign:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Campaign</DialogTitle>
          <DialogDescription>
            Add "{gesture.name}" as a step in one of your campaigns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="campaign">Select Campaign</Label>
            {isLoadingCampaigns ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">
                  No draft campaigns available.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    router.push("/campaigns");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </div>
            ) : (
              <Select
                value={selectedCampaignId}
                onValueChange={setSelectedCampaignId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedCampaignId && (
            <div className="space-y-2">
              <Label htmlFor="note">Personalized Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a personal message to include with this gesture..."
                rows={3}
                value={gestureNote}
                onChange={(e) => setGestureNote(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedCampaignId || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add to Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
