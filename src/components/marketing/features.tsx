"use client";

import { useEffect, useRef, useState } from "react";
import {
  Gift,
  Users,
  Zap,
  BarChart3,
  TreePine,
  Coffee,
  Sparkles,
  Heart,
  Wine,
  Book,
  Ticket,
  Utensils,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Gift,
    title: "Gesture Marketplace",
    description:
      "Choose from hundreds of meaningful gestures - from tree planting to local coffee delivery.",
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Users,
    title: "CRM Integration",
    description:
      "Seamlessly sync with HubSpot, Salesforce, and other CRMs to personalize every touchpoint.",
    color: "#3B82F6",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Multi-Step Campaigns",
    description:
      "Build automated sequences that combine emails, delays, and physical gestures.",
    color: "#8B5CF6",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: BarChart3,
    title: "ROI Analytics",
    description:
      "Track meetings booked, replies received, and cost per engagement across all campaigns.",
    color: "#10B981",
    gradient: "from-emerald-500 to-green-500",
  },
];

const gestures = [
  { icon: TreePine, label: "Tree Planting", price: "$15", color: "#22C55E" },
  { icon: Coffee, label: "Local Coffee", price: "$25", color: "#78350F" },
  { icon: Sparkles, label: "Custom Swag", price: "$50", color: "#8B5CF6" },
  { icon: Heart, label: "Charity Donation", price: "$30", color: "#EF4444" },
  { icon: Wine, label: "Wine Delivery", price: "$75", color: "#991B1B" },
  { icon: Book, label: "Curated Book", price: "$35", color: "#1E40AF" },
  { icon: Ticket, label: "Event Tickets", price: "$100", color: "#DB2777" },
  { icon: Utensils, label: "Team Lunch", price: "$150", color: "#EA580C" },
];

export function Features() {
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);
  const [gesturesVisible, setGesturesVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger feature card animations
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleFeatures((prev) => [...prev, index]);
              }, index * 150);
            });

            // Show gestures after features
            setTimeout(() => {
              setGesturesVisible(true);
            }, features.length * 150 + 200);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 lg:py-32 bg-gradient-to-b from-secondary/30 via-secondary/20 to-background overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Everything you need for{" "}
            <span className="relative">
              <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                high-touch outreach
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 10C50 2 150 2 198 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-primary/30"
                />
              </svg>
            </span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Combine the efficiency of automation with the impact of genuine
            human connection.
          </p>
        </div>

        {/* Feature cards with staggered animation */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className={cn(
                "group relative border-0 shadow-lg overflow-hidden transition-all duration-700",
                visibleFeatures.includes(index)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {/* Gradient border on hover */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  feature.gradient
                )}
                style={{ padding: "1px" }}
              >
                <div className="absolute inset-[1px] bg-card rounded-lg" />
              </div>

              <CardContent className="relative pt-6">
                {/* Icon with animated background */}
                <div className="relative mb-4 inline-flex">
                  <div
                    className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500"
                    style={{ backgroundColor: feature.color }}
                  />
                  <div
                    className="relative rounded-xl p-3 transition-all duration-500 group-hover:scale-110"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon
                      className="h-6 w-6 transition-colors duration-500"
                      style={{ color: feature.color }}
                    />
                  </div>
                </div>

                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover arrow */}
                <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                  Learn more
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gestures section with carousel-like display */}
        <div
          className={cn(
            "mt-20 transition-all duration-1000",
            gesturesVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          )}
        >
          <h3 className="text-center text-xl font-semibold mb-3">
            Popular Gestures
          </h3>
          <p className="text-center text-muted-foreground mb-8 max-w-md mx-auto">
            Meaningful touches that leave lasting impressions
          </p>

          {/* Scrolling gesture badges */}
          <div className="relative">
            {/* Gradient fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            {/* Gesture pills */}
            <div className="flex flex-wrap justify-center gap-3 lg:gap-4">
              {gestures.map((gesture, index) => (
                <div
                  key={gesture.label}
                  className={cn(
                    "group flex items-center gap-3 rounded-full bg-card px-5 py-3 shadow-md border cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-lg",
                    gesturesVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  )}
                  style={{
                    transitionDelay: `${index * 75}ms`,
                    borderColor: `${gesture.color}20`,
                  }}
                >
                  <div
                    className="p-1.5 rounded-full transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${gesture.color}15` }}
                  >
                    <gesture.icon
                      className="h-4 w-4"
                      style={{ color: gesture.color }}
                    />
                  </div>
                  <span className="font-medium text-sm">{gesture.label}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${gesture.color}15`,
                      color: gesture.color,
                    }}
                  >
                    from {gesture.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              ...and{" "}
              <span className="font-semibold text-foreground">200+ more</span>{" "}
              gestures available in our marketplace
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
