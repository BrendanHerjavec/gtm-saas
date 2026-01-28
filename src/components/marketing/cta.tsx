import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-800 to-emerald-700 px-8 py-16 lg:px-16 lg:py-24">
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to create moments that matter?
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Start building your first human campaign today. No credit card required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-green-800 hover:bg-white/90"
                >
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute inset-0 -z-0 opacity-30">
            <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
