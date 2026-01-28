import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Outbound and customer engagement{" "}
            <span className="bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent">
              people actually remember
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            People respond to moments, not messages. Create high-touch engagement
            campaigns that combine personalized gestures with meaningful outreach.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-800 to-emerald-700 hover:from-green-900 hover:to-emerald-800"
              >
                Build your first human campaign
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline">
                <Play className="mr-2 h-4 w-4" />
                See how it works
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 lg:mt-24">
          <div className="relative mx-auto max-w-5xl">
            <div className="rounded-xl border bg-card p-2 shadow-2xl">
              <div className="rounded-lg bg-muted/50 p-8 text-center">
                <p className="text-muted-foreground">
                  Campaign Preview Placeholder
                </p>
                <div className="mt-4 flex justify-center gap-4">
                  <div className="rounded-lg bg-card p-4 shadow-sm">
                    <p className="text-sm font-medium">Step 1</p>
                    <p className="text-xs text-muted-foreground">Send handwritten note</p>
                  </div>
                  <div className="rounded-lg bg-card p-4 shadow-sm">
                    <p className="text-sm font-medium">Step 2</p>
                    <p className="text-xs text-muted-foreground">Wait 3 days</p>
                  </div>
                  <div className="rounded-lg bg-card p-4 shadow-sm">
                    <p className="text-sm font-medium">Step 3</p>
                    <p className="text-xs text-muted-foreground">Plant a tree in their name</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
