import {
  Gift,
  Users,
  Zap,
  BarChart3,
  TreePine,
  Coffee,
  Sparkles,
  Heart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Gift,
    title: "Gesture Marketplace",
    description:
      "Choose from hundreds of meaningful gestures - from tree planting to local coffee delivery.",
  },
  {
    icon: Users,
    title: "CRM Integration",
    description:
      "Seamlessly sync with HubSpot, Salesforce, and other CRMs to personalize every touchpoint.",
  },
  {
    icon: Zap,
    title: "Multi-Step Campaigns",
    description:
      "Build automated sequences that combine emails, delays, and physical gestures.",
  },
  {
    icon: BarChart3,
    title: "ROI Analytics",
    description:
      "Track meetings booked, replies received, and cost per engagement across all campaigns.",
  },
];

const gestures = [
  { icon: TreePine, label: "Tree Planting", price: "$15" },
  { icon: Coffee, label: "Local Coffee", price: "$25" },
  { icon: Sparkles, label: "Custom Swag", price: "$50" },
  { icon: Heart, label: "Charity Donation", price: "$30" },
];

export function Features() {
  return (
    <section className="py-20 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need for{" "}
            <span className="text-primary">high-touch outreach</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Combine the efficiency of automation with the impact of genuine human connection.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20">
          <h3 className="text-center text-xl font-semibold mb-8">
            Popular Gestures
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {gestures.map((gesture) => (
              <div
                key={gesture.label}
                className="flex items-center gap-3 rounded-full bg-card px-5 py-3 shadow-sm border"
              >
                <gesture.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{gesture.label}</span>
                <span className="text-sm text-muted-foreground">
                  from {gesture.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
