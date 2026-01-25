export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import {
  Plus,
  Loader2,
  Mail,
  MoreHorizontal,
  Send,
  Clock,
  CheckCircle,
  PauseCircle,
} from "lucide-react";
import { getCampaigns, getCampaignStats } from "@/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "PAUSED" | "CANCELLED";

export default async function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage email campaigns
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </CardHeader>
              </Card>
            ))}
          </div>
        }
      >
        <CampaignStatsCards />
      </Suspense>

      <Card>
        <CardContent className="p-0">
          <Suspense
            fallback={
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <CampaignsTableWrapper />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function CampaignStatsCards() {
  const stats = await getCampaignStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.byStatus?.SENT || 0} sent
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
          <Send className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.metrics.sent}</div>
          <p className="text-xs text-muted-foreground">
            {stats.metrics.deliveryRate.toFixed(1)}% delivered
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.metrics.openRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.metrics.opened} opened
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.metrics.clickRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.metrics.clicked} clicked
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function CampaignsTableWrapper() {
  const data = await getCampaigns();

  const statusIcons: Record<CampaignStatus, React.ReactNode> = {
    DRAFT: <Clock className="h-4 w-4" />,
    SCHEDULED: <Clock className="h-4 w-4" />,
    SENDING: <Send className="h-4 w-4" />,
    SENT: <CheckCircle className="h-4 w-4" />,
    PAUSED: <PauseCircle className="h-4 w-4" />,
    CANCELLED: <PauseCircle className="h-4 w-4" />,
  };

  const statusColors: Record<CampaignStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
    DRAFT: "secondary",
    SCHEDULED: "default",
    SENDING: "warning",
    SENT: "success",
    PAUSED: "secondary",
    CANCELLED: "destructive",
  };

  if (data.campaigns.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <Mail className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No campaigns yet</h3>
        <p className="text-muted-foreground">
          Create your first campaign to start reaching your audience
        </p>
      </div>
    );
  }

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
        {data.campaigns.map((campaign: { id: string; name: string; subject: string | null; status: CampaignStatus; type: string; stats: { sent: number; opened: number; clicked: number } | null; createdAt: Date }) => (
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
              <Badge
                variant={statusColors[campaign.status]}
                className="gap-1"
              >
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/campaigns/${campaign.id}`}>View Details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
