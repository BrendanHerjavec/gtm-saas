"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  TreePine,
  Leaf,
  Heart,
  Coffee,
  Pizza,
  Cookie,
  Gift,
  CreditCard,
  Sparkles,
  Flower2,
  Dumbbell,
  Palette,
  BookOpen,
  PenTool,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AddToCampaignDialog } from "./add-to-campaign-dialog";

// Map icon name strings to Lucide components
const iconMap: Record<string, LucideIcon> = {
  TreePine,
  Leaf,
  Heart,
  Coffee,
  Pizza,
  Cookie,
  Gift,
  CreditCard,
  Sparkles,
  Flower2,
  Dumbbell,
  Palette,
  BookOpen,
  PenTool,
};

export interface Gesture {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
  popular: boolean;
}

interface GestureCardProps {
  gesture: Gesture;
}

function formatPriceRange(min: number, max: number, currency: string): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatter.format(min)} - ${formatter.format(max)}`;
}

export function GestureCard({ gesture }: GestureCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const Icon = iconMap[gesture.icon] || HelpCircle;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-primary/10 p-3">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            {gesture.popular && (
              <Badge className="bg-gradient-to-r from-green-800 to-emerald-700">
                Popular
              </Badge>
            )}
          </div>
          <h3 className="mt-4 font-semibold">{gesture.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {gesture.description}
          </p>
          <p className="mt-3 text-sm font-medium text-primary">
            {formatPriceRange(gesture.minPrice, gesture.maxPrice, gesture.currency)}
          </p>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add to Campaign
          </Button>
        </CardFooter>
      </Card>

      <AddToCampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gesture={gesture}
      />
    </>
  );
}
