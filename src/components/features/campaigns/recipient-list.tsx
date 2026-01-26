"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Trash2, Loader2 } from "lucide-react";
import { RecipientSelector } from "./recipient-selector";
import {
  removeRecipientFromCampaign,
  removeAllRecipientsFromCampaign,
} from "@/actions/campaign-recipients";

interface CampaignRecipient {
  id: string;
  status: string;
  currentStep: number;
  recipient: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    jobTitle: string | null;
  };
}

interface RecipientListProps {
  campaignId: string;
  recipients: CampaignRecipient[];
  totalSteps: number;
}

export function RecipientList({
  campaignId,
  recipients,
  totalSteps,
}: RecipientListProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removingAll, setRemovingAll] = useState(false);

  const handleRemove = async (recipientId: string) => {
    setRemovingId(recipientId);
    try {
      await removeRecipientFromCampaign(campaignId, recipientId);
      router.refresh();
    } catch (error) {
      console.error("Failed to remove recipient:", error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemoveAll = async () => {
    setRemovingAll(true);
    try {
      await removeAllRecipientsFromCampaign(campaignId);
      router.refresh();
    } catch (error) {
      console.error("Failed to remove all recipients:", error);
    } finally {
      setRemovingAll(false);
    }
  };

  const getInitials = (recipient: CampaignRecipient["recipient"]) => {
    const first = recipient.firstName?.[0] || "";
    const last = recipient.lastName?.[0] || "";
    return (first + last).toUpperCase() || recipient.email[0].toUpperCase();
  };

  const getName = (recipient: CampaignRecipient["recipient"]) => {
    if (recipient.firstName || recipient.lastName) {
      return `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim();
    }
    return recipient.email;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="warning">In Progress</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Recipients</CardTitle>
          <Badge variant="outline">{recipients.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {recipients.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={removingAll}>
                  {removingAll ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Remove All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove all recipients?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all {recipients.length} recipients from this
                    campaign. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemoveAll}>
                    Remove All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <RecipientSelector
            campaignId={campaignId}
            onRecipientsAdded={() => router.refresh()}
          />
        </div>
      </CardHeader>
      <CardContent>
        {recipients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="mt-4 text-lg font-semibold">No recipients yet</h3>
            <p className="text-muted-foreground mb-4">
              Add recipients to start sending this campaign.
            </p>
            <RecipientSelector
              campaignId={campaignId}
              onRecipientsAdded={() => router.refresh()}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((cr) => (
                <TableRow key={cr.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(cr.recipient)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getName(cr.recipient)}</p>
                        <p className="text-sm text-muted-foreground">
                          {cr.recipient.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {cr.recipient.company || "-"}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(cr.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {cr.currentStep} / {totalSteps} steps
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(cr.recipient.id)}
                      disabled={removingId === cr.recipient.id}
                    >
                      {removingId === cr.recipient.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
