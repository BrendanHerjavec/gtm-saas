"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeckCard } from "./deck-card";
import { Button } from "@/components/ui/button";
import { Plus, Layers } from "lucide-react";
import { deleteTaskDeck, openTaskDeck } from "@/actions/task-decks";
import type { TaskDeckWithCreator } from "@/actions/task-decks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeckGridProps {
  decks: TaskDeckWithCreator[];
  onCreateClick?: () => void;
}

export function DeckGrid({ decks, onCreateClick }: DeckGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);

  const handleOpen = (deckId: string) => {
    // Navigate to deck opening experience
    router.push(`/tasks/decks/${deckId}`);
  };

  const handleContinue = (deckId: string) => {
    router.push(`/tasks/decks/${deckId}/work`);
  };

  const handleDeleteClick = (deckId: string) => {
    setDeckToDelete(deckId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deckToDelete) return;

    startTransition(async () => {
      try {
        await deleteTaskDeck(deckToDelete);
        router.refresh();
      } catch (error) {
        console.error("Failed to delete deck:", error);
      } finally {
        setDeleteDialogOpen(false);
        setDeckToDelete(null);
      }
    });
  };

  // Group decks by status
  const sealedDecks = decks.filter((d) => d.status === "SEALED");
  const openedDecks = decks.filter((d) => d.status === "OPENED" || d.status === "OPENING");
  const completedDecks = decks.filter((d) => d.status === "COMPLETED");

  if (decks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="rounded-full bg-muted p-6 w-fit mx-auto mb-4">
          <Layers className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No task decks yet</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Create a deck to group your tasks together. Open them like a pack of cards and work through them one by one.
        </p>
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Deck
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sealed Decks - Ready to Open */}
      {sealedDecks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Ready to Open
              <span className="text-muted-foreground font-normal">
                ({sealedDecks.length})
              </span>
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sealedDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onOpen={handleOpen}
                onDelete={handleDeleteClick}
                onContinue={handleContinue}
              />
            ))}
          </div>
        </div>
      )}

      {/* In Progress Decks */}
      {openedDecks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            In Progress
            <span className="text-muted-foreground font-normal">
              ({openedDecks.length})
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openedDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onOpen={handleOpen}
                onDelete={handleDeleteClick}
                onContinue={handleContinue}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Decks */}
      {completedDecks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">✅</span>
            Completed
            <span className="text-muted-foreground font-normal">
              ({completedDecks.length})
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onOpen={handleOpen}
                onDelete={handleDeleteClick}
                onContinue={handleContinue}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this deck?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the deck but keep all the tasks. The tasks will become unassigned and can be added to a new deck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete Deck"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
