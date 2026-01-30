"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Gift,
  Video,
  PenLine,
  Calendar,
  Mail,
  Building2,
  User,
  Zap,
} from "lucide-react";

type DemoPhase = "intro" | "sealed" | "opening" | "revealing" | "cards" | "swiping";

interface DemoTask {
  id: string;
  type: "VIDEO" | "GIFT" | "HANDWRITTEN_NOTE" | "EXPERIENCE" | "DIRECT_MAIL";
  recipient: string;
  company: string;
  title: string;
  context: string;
}

const demoTasks: DemoTask[] = [
  {
    id: "1",
    type: "VIDEO",
    recipient: "Sarah Chen",
    company: "TechCorp",
    title: "Record personalized intro",
    context: "Met at SaaStr, interested in Q2 rollout",
  },
  {
    id: "2",
    type: "HANDWRITTEN_NOTE",
    recipient: "Michael Park",
    company: "StartupXYZ",
    title: "Congratulate on Series A",
    context: "Just raised $12M, big coffee fan",
  },
  {
    id: "3",
    type: "GIFT",
    recipient: "Emily Rodriguez",
    company: "Enterprise Co",
    title: "Send executive gift basket",
    context: "Director of Procurement, $120k deal",
  },
  {
    id: "4",
    type: "EXPERIENCE",
    recipient: "David Kim",
    company: "Finance Plus",
    title: "Book team lunch",
    context: "Head of Sales, warm intro from Alex",
  },
  {
    id: "5",
    type: "DIRECT_MAIL",
    recipient: "Lisa Thompson",
    company: "MedTech Health",
    title: "Send case study package",
    context: "Healthcare compliance focus",
  },
];

const typeConfig = {
  VIDEO: { icon: Video, color: "#3B82F6", label: "Video" },
  GIFT: { icon: Gift, color: "#F59E0B", label: "Gift" },
  HANDWRITTEN_NOTE: { icon: PenLine, color: "#8B5CF6", label: "Note" },
  EXPERIENCE: { icon: Calendar, color: "#10B981", label: "Experience" },
  DIRECT_MAIL: { icon: Mail, color: "#EC4899", label: "Mail" },
};

export function InteractiveDemo() {
  const [phase, setPhase] = useState<DemoPhase>("intro");
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleStartDemo = () => {
    setPhase("sealed");
  };

  const handleOpenPack = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPhase("opening");

    // Opening animation
    await new Promise((r) => setTimeout(r, 800));
    setPhase("revealing");

    // Reveal cards one by one
    for (let i = 0; i < demoTasks.length; i++) {
      await new Promise((r) => setTimeout(r, 250));
      setRevealedCount((prev) => prev + 1);
    }

    await new Promise((r) => setTimeout(r, 600));
    setPhase("cards");
    setIsAnimating(false);
  };

  const handleStartSwiping = () => {
    setPhase("swiping");
    setCurrentCard(0);
  };

  const handleNextCard = () => {
    if (currentCard < demoTasks.length - 1) {
      setCurrentCard((prev) => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCard > 0) {
      setCurrentCard((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setPhase("intro");
    setRevealedCount(0);
    setCurrentCard(0);
    setIsAnimating(false);
  };

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="outline">
            <Zap className="h-3 w-3 mr-1" />
            Interactive Demo
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Experience the magic
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            See how task decks turn your outreach into an engaging, gamified experience.
            No sign-up required.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Demo Container */}
          <div className="min-h-[500px] flex items-center justify-center">
            {/* Intro Phase */}
            {phase === "intro" && (
              <div className="text-center space-y-8 animate-in fade-in duration-500">
                <div className="relative inline-block">
                  {/* Floating cards preview */}
                  <div className="relative w-64 h-80">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="absolute inset-0 rounded-2xl shadow-xl"
                        style={{
                          background: `linear-gradient(135deg, ${["#3B82F6", "#8B5CF6", "#10B981"][i]} 0%, ${["#1D4ED8", "#6D28D9", "#059669"][i]} 100%)`,
                          transform: `rotate(${(i - 1) * 8}deg) translateY(${i * 4}px)`,
                          zIndex: 3 - i,
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl">
                            {["🎯", "🚀", "💼"][i]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sparkle effects */}
                  <div className="absolute -top-4 -right-4 text-yellow-400 animate-pulse">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div className="absolute -bottom-2 -left-4 text-yellow-400 animate-pulse delay-300">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-2">Ready to open your first pack?</h3>
                  <p className="text-muted-foreground mb-6">
                    Click below to experience how tasks become an adventure
                  </p>
                  <Button size="lg" onClick={handleStartDemo} className="text-lg px-8">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Start Demo
                  </Button>
                </div>
              </div>
            )}

            {/* Sealed Pack Phase */}
            {phase === "sealed" && (
              <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div
                  className="relative w-72 h-96 mx-auto rounded-2xl shadow-2xl cursor-pointer transition-transform hover:scale-105 active:scale-95 group"
                  style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}
                  onClick={handleOpenPack}
                >
                  {/* Holographic shine */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine opacity-0 group-hover:opacity-100" />
                  </div>

                  {/* Border decoration */}
                  <div className="absolute inset-3 border-2 border-white/30 rounded-xl" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
                    <span className="text-7xl mb-4 drop-shadow-lg">🎁</span>
                    <h3 className="text-2xl font-bold text-center drop-shadow-md">Demo Pack</h3>
                    <p className="text-sm text-white/80 mt-2 text-center">
                      5 sample outreach tasks
                    </p>
                    <Badge className="mt-4 bg-white/20 text-white border-white/30">
                      Click to open!
                    </Badge>
                  </div>

                  {/* Sealed indicator */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      SEALED
                    </div>
                  </div>

                  {/* Glow effect */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: "0 0 60px rgba(139, 92, 246, 0.6)" }}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  Click the pack to open it!
                </p>
              </div>
            )}

            {/* Opening Animation Phase */}
            {phase === "opening" && (
              <div className="flex items-center justify-center animate-in fade-in duration-200">
                <div className="relative w-72 h-96" style={{ perspective: "1000px" }}>
                  {/* Left half */}
                  <div
                    className="absolute inset-0 w-1/2 rounded-l-2xl overflow-hidden animate-rip-left"
                    style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}
                  >
                    <div className="absolute inset-0 flex items-center justify-end">
                      <span className="text-6xl opacity-50" style={{ clipPath: "inset(0 50% 0 0)" }}>
                        🎁
                      </span>
                    </div>
                  </div>

                  {/* Right half */}
                  <div
                    className="absolute inset-0 left-1/2 w-1/2 rounded-r-2xl overflow-hidden animate-rip-right"
                    style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}
                  >
                    <div className="absolute inset-0 flex items-center justify-start">
                      <span className="text-6xl opacity-50" style={{ clipPath: "inset(0 0 0 50%)" }}>
                        🎁
                      </span>
                    </div>
                  </div>

                  {/* Light burst */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-full animate-burst" />
                  </div>
                </div>
              </div>
            )}

            {/* Revealing Cards Phase */}
            {phase === "revealing" && (
              <div className="flex flex-col items-center space-y-8 animate-in fade-in duration-200">
                <h3 className="text-xl font-semibold">Revealing your tasks...</h3>

                {/* Card fan */}
                <div className="relative h-72 w-full max-w-md">
                  {demoTasks.map((task, index) => {
                    const isRevealed = index < revealedCount;
                    const angle = (index - 2) * 12;
                    const config = typeConfig[task.type];

                    return (
                      <div
                        key={task.id}
                        className={`absolute left-1/2 top-1/2 w-40 h-56 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                          isRevealed ? "opacity-100" : "opacity-0 scale-75"
                        }`}
                        style={{
                          transform: isRevealed
                            ? `translateX(-50%) translateY(-50%) rotate(${angle}deg)`
                            : "translateX(-50%) translateY(-50%) scale(0.75)",
                          zIndex: index,
                          transitionDelay: `${index * 100}ms`,
                        }}
                      >
                        <Card className="w-full h-full p-3 flex flex-col items-center justify-center text-center shadow-xl border-2"
                          style={{ borderColor: config.color }}>
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                            style={{ backgroundColor: config.color }}
                          >
                            <config.icon className="h-5 w-5 text-white" />
                          </div>
                          <p className="font-semibold text-sm">{task.recipient}</p>
                          <p className="text-xs text-muted-foreground">{task.company}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {config.label}
                          </Badge>
                        </Card>
                      </div>
                    );
                  })}
                </div>

                <p className="text-muted-foreground">
                  {revealedCount} of {demoTasks.length} revealed
                </p>
              </div>
            )}

            {/* Cards Revealed Phase */}
            {phase === "cards" && (
              <div className="text-center space-y-8 animate-in fade-in duration-500">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Your tasks are ready!</h3>
                  <p className="text-muted-foreground">
                    5 personalized outreach tasks to work through
                  </p>
                </div>

                {/* Mini card grid */}
                <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto">
                  {demoTasks.map((task) => {
                    const config = typeConfig[task.type];
                    return (
                      <div
                        key={task.id}
                        className="aspect-[3/4] rounded-lg shadow-md flex items-center justify-center"
                        style={{ backgroundColor: config.color }}
                      >
                        <config.icon className="h-6 w-6 text-white" />
                      </div>
                    );
                  })}
                </div>

                <Button size="lg" onClick={handleStartSwiping}>
                  <ChevronRight className="h-5 w-5 mr-2" />
                  Start Working Through Tasks
                </Button>
              </div>
            )}

            {/* Swiping Phase */}
            {phase === "swiping" && (
              <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
                {/* Progress */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Task {currentCard + 1} of {demoTasks.length}
                  </span>
                  <div className="flex gap-1">
                    {demoTasks.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentCard ? "bg-primary" : i < currentCard ? "bg-primary/50" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Current Card */}
                {(() => {
                  const task = demoTasks[currentCard];
                  const config = typeConfig[task.type];
                  return (
                    <Card className="p-6 shadow-xl">
                      {/* Header */}
                      <div
                        className="flex items-center gap-3 pb-4 mb-4 border-b"
                        style={{ borderColor: `${config.color}30` }}
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: config.color }}
                        >
                          <config.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <Badge style={{ backgroundColor: `${config.color}20`, color: config.color }}>
                            {config.label}
                          </Badge>
                          <p className="font-semibold mt-1">{task.title}</p>
                        </div>
                      </div>

                      {/* Recipient */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{task.recipient}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {task.company}
                            </div>
                          </div>
                        </div>

                        {/* Context */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Context
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            {task.context}
                          </p>
                        </div>
                      </div>

                      {/* Demo Actions */}
                      <div className="flex gap-2 mt-6">
                        <Button variant="outline" className="flex-1" disabled>
                          Skip
                        </Button>
                        <Button className="flex-1" disabled>
                          Complete
                        </Button>
                      </div>
                    </Card>
                  );
                })()}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevCard}
                    disabled={currentCard === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  {currentCard === demoTasks.length - 1 ? (
                    <Button onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  ) : (
                    <Button onClick={handleNextCard}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reset button (always visible except intro) */}
          {phase !== "intro" && phase !== "opening" && phase !== "revealing" && (
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Ready to create your own task decks?
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <a href="/register">
              Get Started Free
              <Sparkles className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
