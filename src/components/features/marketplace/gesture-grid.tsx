"use client";

import { useState } from "react";
import { CategoryFilter } from "./category-filter";
import { GestureCard, type Gesture } from "./gesture-card";

interface GestureGridProps {
  initialGestures: Gesture[];
}

export function GestureGrid({ initialGestures }: GestureGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredGestures =
    selectedCategory === "all"
      ? initialGestures
      : initialGestures.filter((g) => g.category === selectedCategory);

  return (
    <div className="space-y-6">
      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredGestures.map((gesture) => (
          <GestureCard key={gesture.id} gesture={gesture} />
        ))}
      </div>
      {filteredGestures.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No gestures found in this category.
        </div>
      )}
    </div>
  );
}
