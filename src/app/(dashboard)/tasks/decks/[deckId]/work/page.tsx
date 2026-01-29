import { notFound } from "next/navigation";
import { getTaskDeck } from "@/actions/task-decks";
import { DeckWorkClient } from "./deck-work-client";

interface DeckWorkPageProps {
  params: Promise<{ deckId: string }>;
}

export async function generateMetadata({ params }: DeckWorkPageProps) {
  const resolvedParams = await params;
  const deck = await getTaskDeck(resolvedParams.deckId);

  if (!deck) {
    return { title: "Deck Not Found" };
  }

  return {
    title: `Working: ${deck.name} | Tasks`,
    description: "Work through your tasks one by one",
  };
}

export default async function DeckWorkPage({ params }: DeckWorkPageProps) {
  const resolvedParams = await params;
  const deck = await getTaskDeck(resolvedParams.deckId);

  if (!deck) {
    notFound();
  }

  // Get pending/in-progress tasks for this deck
  const tasks = deck.tasks?.filter(
    (t: { status: string }) => t.status === "PENDING" || t.status === "IN_PROGRESS"
  ) || [];

  return (
    <div className="container max-w-5xl py-8">
      <DeckWorkClient
        deck={deck}
        initialTasks={tasks}
      />
    </div>
  );
}
