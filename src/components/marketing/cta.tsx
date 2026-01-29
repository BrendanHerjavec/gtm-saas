"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Gift, Heart, TreePine } from "lucide-react";
import { cn } from "@/lib/utils";

const floatingEmojis = [
  { emoji: "🎁", delay: 0, duration: 15 },
  { emoji: "🌱", delay: 3, duration: 18 },
  { emoji: "☕", delay: 6, duration: 20 },
  { emoji: "💌", delay: 9, duration: 16 },
  { emoji: "🎯", delay: 12, duration: 22 },
  { emoji: "✨", delay: 2, duration: 14 },
];

export function CTA() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl transition-all duration-1000",
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          )}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 animate-gradient bg-[length:200%_200%]" />

          {/* Floating elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {floatingEmojis.map((item, index) => {
              const positions = [
                { top: "10%", left: "5%" },
                { top: "60%", left: "10%" },
                { top: "20%", right: "8%" },
                { top: "70%", right: "12%" },
                { top: "40%", left: "3%" },
                { top: "80%", right: "5%" },
              ];
              const pos = positions[index % positions.length];

              return (
                <div
                  key={index}
                  className="absolute text-3xl animate-float opacity-30"
                  style={{
                    ...pos,
                    animationDelay: `${item.delay}s`,
                    animationDuration: `${item.duration}s`,
                  }}
                >
                  {item.emoji}
                </div>
              );
            })}
          </div>

          {/* Decorative shapes */}
          <div className="absolute inset-0 -z-0 opacity-20">
            <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white/30 blur-3xl animate-blob" />
            <div
              className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-white/30 blur-3xl animate-blob"
              style={{ animationDelay: "-5s" }}
            />
          </div>

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />

          {/* Content */}
          <div className="relative z-10 px-8 py-16 lg:px-16 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              {/* Animated badge */}
              <div
                className={cn(
                  "inline-flex mb-6 transition-all duration-700 delay-100",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-4"
                )}
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-sm font-medium">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  No credit card required
                </span>
              </div>

              <h2
                className={cn(
                  "text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl transition-all duration-700 delay-200",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                )}
              >
                Ready to create moments that matter?
              </h2>

              <p
                className={cn(
                  "mt-6 text-lg text-white/90 transition-all duration-700 delay-300",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                )}
              >
                Start building your first human campaign today. Join thousands
                of sales teams creating meaningful connections.
              </p>

              <div
                className={cn(
                  "mt-10 flex flex-wrap items-center justify-center gap-4 transition-all duration-700 delay-400",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                )}
              >
                <Link href="/register">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="relative overflow-hidden bg-white text-green-800 hover:bg-white/90 text-lg h-12 px-8 shadow-lg group"
                  >
                    <span className="relative z-10 flex items-center">
                      Get started free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/50 text-white hover:bg-white/10 hover:border-white text-lg h-12 px-8 backdrop-blur-sm"
                  >
                    Learn more
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div
                className={cn(
                  "mt-12 flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm transition-all duration-700 delay-500",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                )}
              >
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  <span>500+ gesture options</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span>98% satisfaction rate</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <div className="flex items-center gap-2">
                  <TreePine className="h-4 w-4" />
                  <span>50K+ trees planted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
