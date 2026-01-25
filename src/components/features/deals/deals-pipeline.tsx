"use client";

import Link from "next/link";
import { Building2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatCurrency, getInitials } from "@/lib/utils";

type Deal = {
  id: string;
  name: string;
  value: number;
  status: string;
  stageId: string;
  expectedCloseDate: Date | null;
  actualCloseDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DealStage = {
  id: string;
  name: string;
  probability: number;
  order: number;
};

type DealWithRelations = Deal & {
  owner: { id: string; name: string | null; email: string | null; image: string | null } | null;
  contact: { id: string; firstName: string | null; lastName: string | null } | null;
  company: { id: string; name: string } | null;
};

type StageWithDeals = DealStage & {
  deals: DealWithRelations[];
};

interface DealsPipelineProps {
  stages: StageWithDeals[];
}

export function DealsPipeline({ stages }: DealsPipelineProps) {
  const calculateStageValue = (deals: DealWithRelations[]) => {
    return deals.reduce((sum, deal) => sum + Number(deal.value), 0);
  };

  if (stages.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <p className="text-muted-foreground">
          No pipeline stages found. Create deal stages in settings.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex w-80 flex-shrink-0 flex-col rounded-lg border bg-muted/30"
          >
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="font-semibold">{stage.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {stage.deals.length} deals &bull;{" "}
                  {formatCurrency(calculateStageValue(stage.deals))}
                </p>
              </div>
              <Badge variant="secondary">{stage.probability}%</Badge>
            </div>
            <div className="flex-1 space-y-3 p-3">
              {stage.deals.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No deals
                </p>
              ) : (
                stage.deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

function DealCard({ deal }: { deal: DealWithRelations }) {
  return (
    <Link href={`/deals/${deal.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-medium">{deal.name}</CardTitle>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(Number(deal.value))}
          </p>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          {deal.contact && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              {deal.contact.firstName} {deal.contact.lastName}
            </div>
          )}
          {deal.company && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              {deal.company.name}
            </div>
          )}
          {deal.owner && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Avatar className="h-5 w-5">
                <AvatarImage src={deal.owner.image || ""} />
                <AvatarFallback className="text-xs">
                  {getInitials(deal.owner.name || "")}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {deal.owner.name}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
