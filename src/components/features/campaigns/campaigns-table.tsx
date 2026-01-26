"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Send,
  CheckCircle,
  PauseCircle,
  Play,
  Pause,
  Copy,
} from "lucide-react";
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
  RowActions,
  createViewAction,
  createEditAction,
  createDeleteAction,
} from "@/components/ui/row-actions";
import { deleteCampaign, updateCampaign } from "@/actions/campaigns";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

type Campaign = {
  id: string;
  name: string;
  subject: string | null;
  status: CampaignStatus;
  type: string;
  stats: { sent: number; opened: number; clicked: number } | null;
  createdAt: Date;
};

interface CampaignsTableProps {
  campaigns: Campaign[];
}

const statusIcons: Record<CampaignStatus, React.ReactNode> = {
  DRAFT: <Clock className="h-4 w-4" />,
  ACTIVE: <Send className="h-4 w-4" />,
  PAUSED: <PauseCircle className="h-4 w-4" />,
  COMPLETED: <CheckCircle className="h-4 w-4" />,
  CANCELLED: <PauseCircle className="h-4 w-4" />,
};

const statusColors: Record<CampaignStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  PAUSED: "outline",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (id: string, name: string) => {
    await deleteCampaign(id);
    toast({
      title: "Campaign deleted",
      description: `"${name}" has been deleted.`,
      variant: "success",
    });
    router.refresh();
  };

  const handleStatusChange = async (id: string, newStatus: CampaignStatus) => {
    await updateCampaign(id, { status: newStatus });
    toast({
      title: "Campaign updated",
      description: `Campaign status changed to ${newStatus.toLowerCase()}.`,
      variant: "success",
    });
    router.refresh();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campaign</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Sent</TableHead>
          <TableHead>Opened</TableHead>
          <TableHead>Clicked</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => {
          const canActivate = campaign.status === "DRAFT" || campaign.status === "PAUSED";
          const canPause = campaign.status === "ACTIVE";

          return (
            <TableRow key={campaign.id}>
              <TableCell>
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="font-medium hover:underline"
                >
                  {campaign.name}
                </Link>
                {campaign.subject && (
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {campaign.subject}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[campaign.status]} className="gap-1">
                  {statusIcons[campaign.status]}
                  {campaign.status}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm">{campaign.type}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{campaign.stats?.sent || 0}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{campaign.stats?.opened || 0}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{campaign.stats?.clicked || 0}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(campaign.createdAt)}
              </TableCell>
              <TableCell>
                <RowActions
                  actions={[
                    createViewAction(`/campaigns/${campaign.id}`),
                    createEditAction(`/campaigns/${campaign.id}/edit`),
                    ...(canActivate
                      ? [
                          {
                            label: "Activate",
                            icon: <Play className="h-4 w-4" />,
                            onClick: () => handleStatusChange(campaign.id, "ACTIVE"),
                            requiresConfirmation: true,
                            confirmTitle: "Activate campaign?",
                            confirmDescription:
                              "This will start sending to recipients in this campaign.",
                          },
                        ]
                      : []),
                    ...(canPause
                      ? [
                          {
                            label: "Pause",
                            icon: <Pause className="h-4 w-4" />,
                            onClick: () => handleStatusChange(campaign.id, "PAUSED"),
                          },
                        ]
                      : []),
                    {
                      label: "Duplicate",
                      icon: <Copy className="h-4 w-4" />,
                      onClick: () => {
                        toast({
                          title: "Coming soon",
                          description: "Campaign duplication will be available soon.",
                        });
                      },
                    },
                    createDeleteAction(
                      () => handleDelete(campaign.id, campaign.name),
                      "campaign"
                    ),
                  ]}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
