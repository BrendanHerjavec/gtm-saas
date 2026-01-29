"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Play,
  Gift,
  PenLine,
  Video,
  Mail,
  Calendar,
  Sparkles,
  TreePine,
  Heart,
  Coffee,
  Star,
  CheckCircle2,
  Send,
  Users,
  TrendingUp,
} from "lucide-react";

// Floating icons that orbit around the hero
const floatingIcons = [
  { icon: Gift, color: "#F59E0B", delay: 0 },
  { icon: PenLine, color: "#8B5CF6", delay: 2 },
  { icon: Video, color: "#3B82F6", delay: 4 },
  { icon: Mail, color: "#EC4899", delay: 6 },
  { icon: Calendar, color: "#10B981", delay: 8 },
  { icon: TreePine, color: "#22C55E", delay: 10 },
  { icon: Heart, color: "#EF4444", delay: 12 },
  { icon: Coffee, color: "#78350F", delay: 14 },
];

// Animated stats
const stats = [
  { label: "Tasks Completed", value: "125K+", icon: CheckCircle2 },
  { label: "Gifts Sent", value: "48K+", icon: Send },
  { label: "Happy Teams", value: "2,400+", icon: Users },
  { label: "Avg Response Rate", value: "3.2x", icon: TrendingUp },
];

// Campaign step types for preview
const campaignSteps = [
  { type: "note", label: "Handwritten Note", icon: PenLine, color: "#8B5CF6" },
  { type: "wait", label: "Wait 3 days", icon: Calendar, color: "#6B7280" },
  { type: "gift", label: "Send Local Coffee", icon: Coffee, color: "#78350F" },
  { type: "wait", label: "Wait 2 days", icon: Calendar, color: "#6B7280" },
  { type: "video", label: "Personal Video", icon: Video, color: "#3B82F6" },
];

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const fullText = "people actually remember";

  useEffect(() => {
    setIsVisible(true);

    // Typing animation
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 60);

    // Campaign step animation
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % campaignSteps.length);
    }, 2000);

    return () => {
      clearInterval(typingInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        {/* Primary gradient blobs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/40 to-green-300/30 rounded-full blur-3xl animate-blob" />
        <div
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-200/30 to-cyan-200/20 rounded-full blur-3xl animate-blob"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-blob"
          style={{ animationDelay: "-10s" }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none">
        {floatingIcons.map((item, index) => {
          const IconComponent = item.icon;
          // Position icons around the edges
          const positions = [
            { top: "10%", left: "5%" },
            { top: "20%", right: "8%" },
            { top: "40%", left: "3%" },
            { top: "60%", right: "5%" },
            { top: "75%", left: "8%" },
            { top: "15%", left: "85%" },
            { top: "50%", right: "2%" },
            { top: "80%", right: "10%" },
          ];
          const pos = positions[index % positions.length];

          return (
            <div
              key={index}
              className="absolute animate-float opacity-60"
              style={{
                ...pos,
                animationDelay: `${item.delay}s`,
                animationDuration: `${15 + index * 2}s`,
              }}
            >
              <div
                className="p-3 rounded-2xl shadow-lg backdrop-blur-sm"
                style={{
                  backgroundColor: `${item.color}15`,
                  border: `1px solid ${item.color}30`,
                }}
              >
                <IconComponent
                  className="h-6 w-6"
                  style={{ color: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Animated badge */}
          <div
            className={`inline-flex mb-6 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4"
            }`}
          >
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm font-medium border-primary/30 bg-primary/5"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2 text-primary animate-pulse" />
              The Gifting Layer for Your CRM
              <Star className="h-3.5 w-3.5 ml-2 text-yellow-500 animate-wiggle" />
            </Badge>
          </div>

          {/* Animated headline */}
          <h1
            className={`text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl transition-all duration-700 delay-100 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <span className="block">Gifts and touches</span>
            <span className="relative inline-block mt-2">
              <span className="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                {typedText}
              </span>
              <span className="animate-cursor text-primary">|</span>
            </span>
          </h1>

          {/* Animated description */}
          <p
            className={`mt-8 text-lg lg:text-xl leading-8 text-muted-foreground max-w-2xl mx-auto transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            People respond to{" "}
            <span className="text-foreground font-semibold">moments</span>, not
            messages. Create high-touch engagement campaigns that combine{" "}
            <span className="text-primary font-semibold">
              personalized gestures
            </span>{" "}
            with meaningful outreach.
          </p>

          {/* CTA buttons */}
          <div
            className={`mt-10 flex items-center justify-center gap-4 flex-wrap transition-all duration-700 delay-300 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <Link href="/register">
              <Button
                size="lg"
                className="relative overflow-hidden bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 text-lg h-12 px-8 shadow-lg shadow-green-500/25 group"
              >
                <span className="relative z-10 flex items-center">
                  Start sending personal touches
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 animate-shimmer" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="text-lg h-12 px-8 group"
              >
                <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                See how it works
              </Button>
            </Link>
          </div>

          {/* Trust badges / stats */}
          <div
            className={`mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 transition-all duration-700 delay-500 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="flex flex-col items-center p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <stat.icon className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-2xl lg:text-3xl font-bold text-foreground">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Animated campaign preview */}
        <div
          className={`mt-16 lg:mt-24 transition-all duration-1000 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl -z-10 animate-pulse-ring" />

            <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-3 shadow-2xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 pb-3 border-b mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                    campaign-builder.app
                  </div>
                </div>
              </div>

              {/* Campaign builder preview */}
              <div className="rounded-lg bg-gradient-to-br from-muted/30 to-muted/50 p-6 lg:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-1">
                    Building: Enterprise Welcome Sequence
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    A 5-step sequence to create lasting first impressions
                  </p>
                </div>

                {/* Animated campaign steps */}
                <div className="relative">
                  {/* Connection line */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 hidden md:block" />

                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
                    {campaignSteps.map((step, index) => {
                      const isActive = index === activeStep;
                      const isPast = index < activeStep;
                      const StepIcon = step.icon;

                      return (
                        <div
                          key={index}
                          className={`relative flex flex-col items-center transition-all duration-500 ${
                            isActive ? "scale-110 z-10" : "scale-100"
                          }`}
                        >
                          {/* Step circle */}
                          <div
                            className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                              isActive
                                ? "ring-4 ring-primary/30"
                                : isPast
                                ? "opacity-80"
                                : "opacity-60"
                            }`}
                            style={{
                              backgroundColor: isActive
                                ? step.color
                                : `${step.color}30`,
                              transform: isActive ? "translateY(-4px)" : "none",
                            }}
                          >
                            <StepIcon
                              className={`h-6 w-6 lg:h-7 lg:w-7 transition-colors ${
                                isActive ? "text-white" : ""
                              }`}
                              style={{ color: isActive ? "#fff" : step.color }}
                            />
                          </div>

                          {/* Step label */}
                          <span
                            className={`mt-2 text-xs lg:text-sm font-medium text-center max-w-[100px] transition-all duration-300 ${
                              isActive
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </span>

                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active step detail */}
                <div className="mt-8 p-4 rounded-xl bg-card border border-border/50 max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: campaignSteps[activeStep].color,
                      }}
                    >
                      {(() => {
                        const ActiveIcon = campaignSteps[activeStep].icon;
                        return (
                          <ActiveIcon className="h-5 w-5 text-white animate-bounce-subtle" />
                        );
                      })()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {campaignSteps[activeStep].label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Step {activeStep + 1} of {campaignSteps.length}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="animate-pulse bg-primary/10 border-primary/30"
                    >
                      Active
                    </Badge>
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
