import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  connected?: boolean;
  popular?: boolean;
}

interface IntegrationCardProps {
  integration: Integration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const Icon = integration.icon;

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-muted p-3">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex gap-2">
            {integration.popular && (
              <Badge variant="secondary">Popular</Badge>
            )}
            {integration.connected && (
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                Connected
              </Badge>
            )}
          </div>
        </div>
        <h3 className="mt-4 font-semibold">{integration.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {integration.description}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {integration.category}
        </p>
      </CardContent>
      <CardFooter className="bg-muted/30 border-t">
        <Button
          variant={integration.connected ? "outline" : "default"}
          size="sm"
          className="w-full"
        >
          {integration.connected ? "Manage" : "Connect"}
        </Button>
      </CardFooter>
    </Card>
  );
}
