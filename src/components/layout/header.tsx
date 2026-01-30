"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Plus, UserPlus, Send, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "next-auth/react";
import { getInitials } from "@/lib/utils";
import { createCampaign } from "@/actions/campaigns";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) return;
    setIsCreatingCampaign(true);
    try {
      const campaign = await createCampaign({ name: campaignName.trim(), content: campaignDescription.trim() || undefined });
      setCampaignDialogOpen(false);
      setCampaignName("");
      setCampaignDescription("");
      router.push(`/campaigns/${campaign.id}/edit`);
    } catch (error) {
      console.error("Failed to create campaign:", error);
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search leads, contacts, deals..."
            className="w-80 pl-9"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Quick Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/recipients/new")}>
              <UserPlus className="mr-2 h-4 w-4" />
              New Recipient
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/sends/new")}>
              <Send className="mr-2 h-4 w-4" />
              New Send
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCampaignDialogOpen(true)}>
              <Zap className="mr-2 h-4 w-4" />
              New Campaign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Give your campaign a name and start building the flow.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quick-campaign-name">Campaign Name</Label>
                <Input
                  id="quick-campaign-name"
                  placeholder="e.g., Q1 Outreach Campaign"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-campaign-desc">Description (optional)</Label>
                <Textarea
                  id="quick-campaign-desc"
                  placeholder="What is this campaign about?"
                  rows={3}
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign} disabled={!campaignName.trim() || isCreatingCampaign}>
                {isCreatingCampaign && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create & Build
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src={session?.user?.image || ""} alt="Profile" />
                <AvatarFallback>
                  {getInitials(session?.user?.name || "User")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings">Settings</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings/organization">Organization</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
