"use client";

import { useState } from "react";
import {
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
} from "lucide-react";
import { CategoryFilter } from "./category-filter";
import { GestureCard, type Gesture } from "./gesture-card";

const gestures: Gesture[] = [
  // Sustainability
  {
    id: "tree-planting",
    name: "Tree Planting",
    description: "Plant a tree in the recipient's name with a personalized certificate.",
    category: "sustainability",
    priceRange: "$15 - $25",
    icon: TreePine,
    popular: true,
  },
  {
    id: "carbon-offset",
    name: "Carbon Offset",
    description: "Offset carbon emissions on behalf of the recipient.",
    category: "sustainability",
    priceRange: "$20 - $100",
    icon: Leaf,
  },
  {
    id: "charity-donation",
    name: "Charity Donation",
    description: "Make a donation to a charity of the recipient's choice.",
    category: "sustainability",
    priceRange: "$25 - $100",
    icon: Heart,
  },
  // Food & Beverage
  {
    id: "local-coffee",
    name: "Local Coffee Delivery",
    description: "Send a coffee from a local cafe near the recipient.",
    category: "food",
    priceRange: "$20 - $35",
    icon: Coffee,
    popular: true,
  },
  {
    id: "team-lunch",
    name: "Team Lunch",
    description: "Deliver lunch to the recipient's team for a celebration.",
    category: "food",
    priceRange: "$100 - $250",
    icon: Pizza,
  },
  {
    id: "treats-box",
    name: "Treats Box",
    description: "Curated box of gourmet treats and snacks.",
    category: "food",
    priceRange: "$40 - $80",
    icon: Cookie,
  },
  // Gifting
  {
    id: "custom-swag",
    name: "Custom Swag Box",
    description: "Branded swag box with quality items they'll actually use.",
    category: "gifting",
    priceRange: "$50 - $150",
    icon: Gift,
  },
  {
    id: "gift-card",
    name: "Premium Gift Card",
    description: "Choose from 100+ brands for the perfect gift card.",
    category: "gifting",
    priceRange: "$25 - $250",
    icon: CreditCard,
  },
  {
    id: "premium-gift",
    name: "Premium Gift",
    description: "High-end curated gifts for executive-level gestures.",
    category: "gifting",
    priceRange: "$150 - $500",
    icon: Sparkles,
  },
  // Wellness
  {
    id: "wellness-credit",
    name: "Wellness Credit",
    description: "Credit for wellness apps, classes, or services.",
    category: "wellness",
    priceRange: "$50 - $150",
    icon: Flower2,
  },
  {
    id: "fitness-credit",
    name: "Fitness Credit",
    description: "Credit for gym memberships or fitness classes.",
    category: "wellness",
    priceRange: "$75 - $200",
    icon: Dumbbell,
  },
  // Experiences
  {
    id: "custom-art",
    name: "Custom Art Piece",
    description: "Commission a custom art piece for the recipient.",
    category: "experiences",
    priceRange: "$100 - $500",
    icon: Palette,
  },
  // Personal Touch
  {
    id: "custom-book",
    name: "Curated Book",
    description: "A thoughtfully selected book based on their interests.",
    category: "personal",
    priceRange: "$20 - $40",
    icon: BookOpen,
  },
  {
    id: "handwritten-note",
    name: "Handwritten Note",
    description: "A genuine handwritten note on premium stationery.",
    category: "personal",
    priceRange: "$10 - $25",
    icon: PenTool,
    popular: true,
  },
];

export function GestureGrid() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredGestures =
    selectedCategory === "all"
      ? gestures
      : gestures.filter((g) => g.category === selectedCategory);

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
