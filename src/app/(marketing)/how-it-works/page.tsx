import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  Target,
  Gift,
  Send,
  BarChart3,
  Repeat,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Users,
    title: "Import Your Contacts",
    description:
      "Connect your CRM or upload a list. We'll enrich profiles with relevant context for personalization.",
  },
  {
    number: 2,
    icon: Target,
    title: "Define Your Audience",
    description:
      "Segment contacts by role, industry, deal stage, or custom criteria to target the right people.",
  },
  {
    number: 3,
    icon: Gift,
    title: "Choose Your Gestures",
    description:
      "Browse our marketplace for meaningful gestures - tree planting, local coffee, handwritten notes, and more.",
  },
  {
    number: 4,
    icon: Send,
    title: "Build Your Campaign",
    description:
      "Create multi-step sequences that combine emails, delays, and physical gestures into cohesive experiences.",
  },
  {
    number: 5,
    icon: Repeat,
    title: "Launch & Automate",
    description:
      "Set your campaign live and let our platform handle fulfillment while you focus on closing deals.",
  },
  {
    number: 6,
    icon: BarChart3,
    title: "Measure & Optimize",
    description:
      "Track opens, replies, meetings booked, and ROI. Iterate on what works to improve results.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            How Moments Works
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            From contact import to closed deal - here&apos;s how to create campaigns
            that get responses.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.number} className="relative overflow-hidden">
              <div className="absolute top-4 right-4 text-6xl font-bold text-muted/20">
                {step.number}
              </div>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-800 to-emerald-700 hover:from-green-900 hover:to-emerald-800"
            >
              Start building your first campaign
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
