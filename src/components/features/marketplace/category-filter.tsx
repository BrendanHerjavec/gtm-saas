"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "All Gestures" },
  { id: "sustainability", label: "Sustainability" },
  { id: "food", label: "Food & Beverage" },
  { id: "gifting", label: "Gifting" },
  { id: "wellness", label: "Wellness" },
  { id: "experiences", label: "Experiences" },
  { id: "personal", label: "Personal Touch" },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant="outline"
          size="sm"
          className={cn(
            selected === category.id &&
              "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => onSelect(category.id)}
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
}
