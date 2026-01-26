import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignBuilder } from "@/components/features/campaigns/campaign-builder";
import { getCampaignWithSteps } from "@/actions/campaign-steps";
import { getGestures } from "@/actions/gestures";

interface EditCampaignPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = await params;

  try {
    const [campaign, { gestures }] = await Promise.all([
      getCampaignWithSteps(id),
      getGestures(),
    ]);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/campaigns/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <p className="text-muted-foreground">
              Build your campaign flow by adding steps
            </p>
          </div>
        </div>

        <CampaignBuilder
          campaignId={campaign.id}
          campaignName={campaign.name}
          initialSteps={campaign.steps}
          gestures={gestures}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
