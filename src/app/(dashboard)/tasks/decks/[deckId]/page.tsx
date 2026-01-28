import { notFound } from "next/navigation";
import { getTaskDeck } from "@/actions/task-decks";
import { DeckOpeningExperience } from "./deck-opening-experience";

interface DeckPageProps {
  params: Promise<{ deckId: string }>;
}

export async function generateMetadata({ params }: DeckPageProps) {
  const resolvedParams = await params;
  const deck = await getTaskDeck(resolvedParams.deckId);

  if (!deck) {
    return { title: "Deck Not Found" };
  }

  return {
    title: `${deck.name} | Tasks`,
    description: deck.description || "Open this deck and work through your tasks",
  };
}

export default async function DeckPage({ params }: DeckPageProps) {
  const resolvedParams = await params;
  const deck = await getTaskDeck(resolvedParams.deckId);

  if (!deck) {
    notFound();
  }

  // Get tasks for this deck
  const tasks = deck.tasks || [];

  return (
    <div className="container max-w-4xl py-8">
      <DeckOpeningExperience
        deck={deck}
        tasks={tasks}
      />
    </div>
  );
}
