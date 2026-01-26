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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Loader2, Users } from "lucide-react";
import {
  getAvailableRecipients,
  addRecipientsToCampaign,
} from "@/actions/campaign-recipients";

interface Recipient {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  jobTitle: string | null;
}

interface RecipientSelectorProps {
  campaignId: string;
  onRecipientsAdded?: () => void;
}

export function RecipientSelector({
  campaignId,
  onRecipientsAdded,
}: RecipientSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Load recipients when dialog opens or search changes
  useEffect(() => {
    if (open) {
      setIsSearching(true);
      const timeout = setTimeout(() => {
        getAvailableRecipients(campaignId, search)
          .then(setRecipients)
          .catch(console.error)
          .finally(() => setIsSearching(false));
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [open, search, campaignId]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(recipients.map((r) => r.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;

    setIsLoading(true);
    try {
      await addRecipientsToCampaign(campaignId, Array.from(selectedIds));
      setOpen(false);
      setSelectedIds(new Set());
      setSearch("");
      router.refresh();
      onRecipientsAdded?.();
    } catch (error) {
      console.error("Failed to add recipients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (recipient: Recipient) => {
    const first = recipient.firstName?.[0] || "";
    const last = recipient.lastName?.[0] || "";
    return (first + last).toUpperCase() || recipient.email[0].toUpperCase();
  };

  const getName = (recipient: Recipient) => {
    if (recipient.firstName || recipient.lastName) {
      return `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim();
    }
    return recipient.email;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Recipients
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Recipients</DialogTitle>
          <DialogDescription>
            Select recipients to include in this campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search recipients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {recipients.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedIds.size} of {recipients.length} selected
              </span>
              <div className="space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  disabled={selectedIds.size === recipients.length}
                >
                  Select all
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAll}
                  disabled={selectedIds.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-[300px] rounded-md border">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "No recipients found matching your search."
                    : "All recipients are already in this campaign."}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleSelect(recipient.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(recipient.id)}
                      onCheckedChange={() => toggleSelect(recipient.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(recipient)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getName(recipient)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {recipient.company || recipient.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedIds.size === 0 || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ""}Recipients
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
