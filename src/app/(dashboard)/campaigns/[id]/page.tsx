import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepCard } from "@/components/features/campaigns/step-card";
import { RecipientList } from "@/components/features/campaigns/recipient-list";
import { GenerateTasksButton } from "@/components/features/campaigns/generate-tasks-button";
import { getCampaignWithSteps } from "@/actions/campaign-steps";
import { formatDate } from "@/lib/utils";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params;

  try {
    const campaign = await getCampaignWithSteps(id);

    const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
      DRAFT: "secondary",
      ACTIVE: "success",
      PAUSED: "warning",
      COMPLETED: "default",
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/campaigns">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
                <Badge variant={statusColors[campaign.status] || "secondary"}>
                  {campaign.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Created {formatDate(campaign.createdAt)} by {campaign.createdBy?.name || "Unknown"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GenerateTasksButton
              campaignId={campaign.id}
              campaignName={campaign.name}
              recipientCount={campaign.recipients.length}
            />
            {campaign.status === "DRAFT" && (
              <Button variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Activate
              </Button>
            )}
            {campaign.status === "ACTIVE" && (
              <Button variant="outline">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            <Button asChild>
              <Link href={`/campaigns/${id}/edit`}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Campaign
              </Link>
            </Button>
          </div>
        </div>

        {campaign.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{campaign.description}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recipients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.recipients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.steps.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gestures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaign.steps.filter((s) => s.stepType === "GESTURE").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaign.steps.filter((s) => s.stepType === "EMAIL").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.stats?.totalSends || 0}</div>
            </CardContent>
          </Card>
        </div>

        <RecipientList
          campaignId={campaign.id}
          recipients={campaign.recipients}
          totalSteps={campaign.steps.length}
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Campaign Steps</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/campaigns/${id}/edit`}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Steps
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {campaign.steps.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No steps configured yet.
                </p>
                <Button asChild>
                  <Link href={`/campaigns/${id}/edit`}>Add Steps</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaign.steps.map((step) => (
                  <StepCard key={step.id} step={step} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } catch {
    notFound();
  }
}
