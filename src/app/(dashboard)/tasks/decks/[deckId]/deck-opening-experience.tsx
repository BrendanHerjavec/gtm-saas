"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Sparkles,
  Play,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { openTaskDeck } from "@/actions/task-decks";
import type { TaskDeckWithCreator } from "@/actions/task-decks";
import type { OutreachTaskWithRecipient } from "@/actions/tasks";

type AnimationPhase = "sealed" | "opening" | "revealing" | "revealed" | "working";

interface DeckOpeningExperienceProps {
  deck: TaskDeckWithCreator;
  tasks: OutreachTaskWithRecipient[];
}

export function DeckOpeningExperience({ deck, tasks }: DeckOpeningExperienceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [phase, setPhase] = useState<AnimationPhase>(
    deck.status === "SEALED" ? "sealed" : "revealed"
  );
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Handle the opening animation sequence
  const handleOpen = () => {
    startTransition(async () => {
      setPhase("opening");

      // Start the animation
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Update server state
      await openTaskDeck(deck.id);

      // Move to revealing phase
      setPhase("revealing");

      // Reveal cards one by one
      for (let i = 0; i < Math.min(tasks.length, 5); i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setRevealedCount((prev) => prev + 1);
      }

      // Complete reveal
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPhase("revealed");
      router.refresh();
    });
  };

  const handleStartWorking = () => {
    setPhase("working");
  };

  const handleGoBack = () => {
    router.push("/tasks");
  };

  // Render based on phase
  if (phase === "sealed") {
    return <SealedPackView deck={deck} onOpen={handleOpen} isOpening={isPending} />;
  }

  if (phase === "opening") {
    return <OpeningAnimation deck={deck} />;
  }

  if (phase === "revealing") {
    return (
      <CardRevealAnimation
        deck={deck}
        tasks={tasks}
        revealedCount={revealedCount}
      />
    );
  }

  if (phase === "revealed") {
    return (
      <RevealedView
        deck={deck}
        tasks={tasks}
        onStartWorking={handleStartWorking}
        onGoBack={handleGoBack}
      />
    );
  }

  // Working phase - redirect to work page
  router.push(`/tasks/decks/${deck.id}/work`);
  return null;
}

// Sealed Pack View
function SealedPackView({
  deck,
  onOpen,
  isOpening,
}: {
  deck: TaskDeckWithCreator;
  onOpen: () => void;
  isOpening: boolean;
}) {
  return (
    <div className="space-y-6">
      <Link
        href="/tasks"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Tasks
      </Link>

      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        {/* Sealed Pack */}
        <div
          className="relative w-72 h-96 rounded-2xl shadow-2xl cursor-pointer transition-transform hover:scale-105 active:scale-95 group"
          style={{ backgroundColor: deck.coverColor || "#3B82F6" }}
          onClick={onOpen}
        >
          {/* Holographic shine effect */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine opacity-0 group-hover:opacity-100" />
          </div>

          {/* Pack border decoration */}
          <div className="absolute inset-3 border-2 border-white/30 rounded-xl" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
            <span className="text-7xl mb-4 drop-shadow-lg">{deck.emoji || "📦"}</span>
            <h2 className="text-2xl font-bold text-center drop-shadow-md">{deck.name}</h2>
            <p className="text-sm text-white/80 mt-2 text-center">
              {deck.description}
            </p>
            <Badge className="mt-4 bg-white/20 text-white border-white/30">
              <Layers className="h-3 w-3 mr-1" />
              {deck.totalTasks} cards
            </Badge>
          </div>

          {/* Sealed indicator */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              SEALED
            </div>
          </div>

          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              boxShadow: `0 0 60px ${deck.coverColor || "#3B82F6"}`,
            }}
          />
        </div>

        {/* Open Button */}
        <Button
          size="lg"
          onClick={onOpen}
          disabled={isOpening}
          className="text-lg px-8 py-6"
        >
          {isOpening ? (
            <>
              <Sparkles className="h-5 w-5 mr-2 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Open Deck
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground">
          Click the pack or button to open
        </p>
      </div>
    </div>
  );
}

// Opening Animation
function OpeningAnimation({ deck }: { deck: TaskDeckWithCreator }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div
        className="relative w-72 h-96 animate-pack-shake"
        style={{ perspective: "1000px" }}
      >
        {/* Left half */}
        <div
          className="absolute inset-0 w-1/2 rounded-l-2xl overflow-hidden animate-rip-left"
          style={{ backgroundColor: deck.coverColor || "#3B82F6" }}
        >
          <div className="absolute inset-0 flex items-center justify-end pr-0">
            <span className="text-6xl opacity-50" style={{ clipPath: "inset(0 50% 0 0)" }}>
              {deck.emoji || "📦"}
            </span>
          </div>
        </div>

        {/* Right half */}
        <div
          className="absolute inset-0 left-1/2 w-1/2 rounded-r-2xl overflow-hidden animate-rip-right"
          style={{ backgroundColor: deck.coverColor || "#3B82F6" }}
        >
          <div className="absolute inset-0 flex items-center justify-start pl-0">
            <span className="text-6xl opacity-50" style={{ clipPath: "inset(0 0 0 50%)" }}>
              {deck.emoji || "📦"}
            </span>
          </div>
        </div>

        {/* Light burst */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-white rounded-full animate-burst" />
        </div>
      </div>
    </div>
  );
}

// Card Reveal Animation
function CardRevealAnimation({
  deck,
  tasks,
  revealedCount,
}: {
  deck: TaskDeckWithCreator;
  tasks: OutreachTaskWithRecipient[];
  revealedCount: number;
}) {
  const displayTasks = tasks.slice(0, 5);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
      <h2 className="text-2xl font-bold">{deck.name}</h2>

      {/* Card fan */}
      <div className="relative h-80 w-full max-w-lg">
        {displayTasks.map((task, index) => {
          const isRevealed = index < revealedCount;
          const angle = (index - 2) * 8; // Fan angle
          const offset = index * 2;

          return (
            <div
              key={task.id}
              className={`absolute left-1/2 top-1/2 w-48 h-64 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                isRevealed ? "opacity-100" : "opacity-0 scale-75"
              }`}
              style={{
                transform: isRevealed
                  ? `translateX(-50%) translateY(-50%) rotate(${angle}deg) translateY(${offset}px)`
                  : "translateX(-50%) translateY(-50%) scale(0.75)",
                zIndex: index,
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <Card className="w-full h-full p-4 flex flex-col items-center justify-center text-center shadow-lg">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: deck.coverColor || "#3B82F6" }}
                >
                  <span className="text-white text-2xl">
                    {task.taskType === "VIDEO" && "🎥"}
                    {task.taskType === "GIFT" && "🎁"}
                    {task.taskType === "HANDWRITTEN_NOTE" && "✉️"}
                    {task.taskType === "EXPERIENCE" && "🎉"}
                    {task.taskType === "DIRECT_MAIL" && "📧"}
                  </span>
                </div>
                <p className="font-semibold text-sm line-clamp-2">
                  {task.recipient.firstName} {task.recipient.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {task.recipient.company}
                </p>
              </Card>
            </div>
          );
        })}
      </div>

      <p className="text-muted-foreground">
        Revealing {revealedCount} of {Math.min(tasks.length, 5)} cards...
      </p>
    </div>
  );
}

// Revealed View
function RevealedView({
  deck,
  tasks,
  onStartWorking,
  onGoBack,
}: {
  deck: TaskDeckWithCreator;
  tasks: OutreachTaskWithRecipient[];
  onStartWorking: () => void;
  onGoBack: () => void;
}) {
  const pendingTasks = tasks.filter(
    (t) => t.status === "PENDING" || t.status === "IN_PROGRESS"
  );

  return (
    <div className="space-y-6">
      <Link
        href="/tasks"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Tasks
      </Link>

      <div className="text-center space-y-4">
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
          style={{ backgroundColor: deck.coverColor || "#3B82F6" }}
        >
          <span className="text-4xl">{deck.emoji || "📦"}</span>
        </div>
        <h1 className="text-3xl font-bold">{deck.name}</h1>
        <p className="text-muted-foreground">{deck.description}</p>

        <div className="flex items-center justify-center gap-4 text-sm">
          <Badge variant="secondary">
            <Layers className="h-3 w-3 mr-1" />
            {tasks.length} total tasks
          </Badge>
          <Badge variant="outline" className="text-green-600 border-green-600">
            {pendingTasks.length} to complete
          </Badge>
        </div>
      </div>

      {/* Task preview grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {tasks.slice(0, 6).map((task) => (
          <Card key={task.id} className="p-4">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: deck.coverColor || "#3B82F6" }}
              >
                <span className="text-white text-lg">
                  {task.taskType === "VIDEO" && "🎥"}
                  {task.taskType === "GIFT" && "🎁"}
                  {task.taskType === "HANDWRITTEN_NOTE" && "✉️"}
                  {task.taskType === "EXPERIENCE" && "🎉"}
                  {task.taskType === "DIRECT_MAIL" && "📧"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {task.recipient.firstName} {task.recipient.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {task.recipient.company}
                </p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {task.taskType.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {tasks.length > 6 && (
        <p className="text-center text-sm text-muted-foreground">
          +{tasks.length - 6} more tasks
        </p>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-4 pt-4">
        <Button variant="outline" onClick={onGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Decks
        </Button>
        <Button onClick={onStartWorking} size="lg">
          <Play className="h-4 w-4 mr-2" />
          Start Working
        </Button>
      </div>
    </div>
  );
}
