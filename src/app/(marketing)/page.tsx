import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { InteractiveDemo } from "@/components/marketing/interactive-demo";
import { CTA } from "@/components/marketing/cta";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <InteractiveDemo />
      <Features />
      <CTA />
    </>
  );
}
