"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Eye, Send, Ban, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Action {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => Promise<void> | void;
  variant?: "default" | "destructive";
  requiresConfirmation?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
}

interface RowActionsProps {
  actions: Action[];
}

export function RowActions({ actions }: RowActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: Action | null;
  }>({ open: false, action: null });
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: Action) => {
    if (action.requiresConfirmation) {
      setConfirmDialog({ open: true, action });
      setIsOpen(false);
      return;
    }

    if (action.href) {
      router.push(action.href);
      return;
    }

    if (action.onClick) {
      setIsLoading(true);
      try {
        await action.onClick();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Action failed",
          description: error instanceof Error ? error.message : "Something went wrong",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleConfirm = async () => {
    if (!confirmDialog.action?.onClick) return;

    setIsLoading(true);
    try {
      await confirmDialog.action.onClick();
      setConfirmDialog({ open: false, action: null });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action, index) => (
            <div key={action.label}>
              {index > 0 && action.variant === "destructive" && (
                <DropdownMenuSeparator />
              )}
              <DropdownMenuItem
                onClick={() => handleAction(action)}
                className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
                disabled={isLoading}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, action: open ? confirmDialog.action : null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action?.confirmTitle || "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action?.confirmDescription ||
                "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <Button
              variant={confirmDialog.action?.variant || "default"}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmDialog.action?.label || "Confirm"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Pre-built action creators for common operations
export const createViewAction = (href: string): Action => ({
  label: "View",
  icon: <Eye className="h-4 w-4" />,
  href,
});

export const createEditAction = (href: string): Action => ({
  label: "Edit",
  icon: <Pencil className="h-4 w-4" />,
  href,
});

export const createDeleteAction = (
  onDelete: () => Promise<void>,
  itemName: string = "item"
): Action => ({
  label: "Delete",
  icon: <Trash2 className="h-4 w-4" />,
  onClick: onDelete,
  variant: "destructive",
  requiresConfirmation: true,
  confirmTitle: `Delete ${itemName}?`,
  confirmDescription: `This will permanently delete this ${itemName}. This action cannot be undone.`,
});

export const createSendAction = (href: string): Action => ({
  label: "Send Gift",
  icon: <Send className="h-4 w-4" />,
  href,
});

export const createToggleStatusAction = (
  isActive: boolean,
  onToggle: () => Promise<void>
): Action => ({
  label: isActive ? "Deactivate" : "Activate",
  icon: isActive ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />,
  onClick: onToggle,
  requiresConfirmation: true,
  confirmTitle: isActive ? "Deactivate?" : "Activate?",
  confirmDescription: isActive
    ? "This will prevent any sends to this recipient."
    : "This will allow sends to this recipient again.",
});
