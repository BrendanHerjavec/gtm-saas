import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Target,
  Handshake,
  UserPlus,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

const useCases = [
  {
    icon: Target,
    title: "High-Touch Outbound",
    badge: "Sales",
    description:
      "Break through the noise with personalized gestures that show prospects you've done your homework.",
    examples: [
      "Send a local coffee to prospects before your demo call",
      "Plant a tree in their name after a positive meeting",
      "Deliver a handwritten thank-you note post-proposal",
    ],
    stats: { label: "Average response rate", value: "34%" },
  },
  {
    icon: Handshake,
    title: "Deal Acceleration",
    badge: "Revenue",
    description:
      "Move deals through the pipeline faster by creating memorable moments at critical stages.",
    examples: [
      "Celebrate milestones with thoughtful gifts",
      "Re-engage stalled deals with unexpected gestures",
      "Stand out from competitors with human touches",
    ],
    stats: { label: "Faster deal velocity", value: "2.4x" },
  },
  {
    icon: UserPlus,
    title: "Customer Onboarding",
    badge: "Success",
    description:
      "Start customer relationships on the right foot with a welcome experience they'll remember.",
    examples: [
      "Welcome kit with branded items and handwritten note",
      "Celebrate go-live with a team lunch delivery",
      "Mark training completion with a sustainability gesture",
    ],
    stats: { label: "Improved NPS score", value: "+18" },
  },
  {
    icon: RefreshCw,
    title: "Retention & Expansion",
    badge: "Growth",
    description:
      "Keep customers engaged and identify expansion opportunities through thoughtful touchpoints.",
    examples: [
      "Anniversary celebrations with personalized gifts",
      "Quarterly business review appreciation gestures",
      "Referral thank-you campaigns",
    ],
    stats: { label: "Higher renewal rate", value: "12%" },
  },
];

export default function UseCasesPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Use Cases
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover how teams use Moments to create meaningful engagement across
            the customer journey.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {useCases.map((useCase) => (
            <Card key={useCase.title} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <useCase.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{useCase.title}</CardTitle>
                  </div>
                  <Badge variant="secondary">{useCase.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{useCase.description}</p>
                <ul className="mt-4 space-y-2">
                  {useCase.examples.map((example, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {example}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 rounded-lg bg-secondary/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    {useCase.stats.label}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {useCase.stats.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="mb-4 text-muted-foreground">
            Ready to create moments that matter?
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-800 to-emerald-700 hover:from-green-900 hover:to-emerald-800"
            >
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
