import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Gesture {
  id: string;
  name: string;
  description: string;
  category: string;
  priceRange: string;
  icon: LucideIcon;
  popular?: boolean;
}

interface GestureCardProps {
  gesture: Gesture;
}

export function GestureCard({ gesture }: GestureCardProps) {
  const Icon = gesture.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {gesture.popular && (
            <Badge className="bg-gradient-to-r from-orange-500 to-amber-500">
              Popular
            </Badge>
          )}
        </div>
        <h3 className="mt-4 font-semibold">{gesture.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {gesture.description}
        </p>
        <p className="mt-3 text-sm font-medium text-primary">
          {gesture.priceRange}
        </p>
      </CardContent>
      <CardFooter className="bg-muted/30 border-t">
        <Button variant="ghost" size="sm" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add to Campaign
        </Button>
      </CardFooter>
    </Card>
  );
}
