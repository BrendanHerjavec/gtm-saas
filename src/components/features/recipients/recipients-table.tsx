"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Building2, Send, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RowActions,
  createViewAction,
  createEditAction,
  createDeleteAction,
  createSendAction,
  createToggleStatusAction,
} from "@/components/ui/row-actions";
import { deleteRecipient, updateRecipient } from "@/actions/recipients";
import { useToast } from "@/hooks/use-toast";

type Recipient = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  doNotSend: boolean;
  externalSource: string | null;
};

interface RecipientsTableProps {
  recipients: Recipient[];
}

export function RecipientsTable({ recipients }: RecipientsTableProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (id: string, name: string) => {
    await deleteRecipient(id);
    toast({
      title: "Recipient deleted",
      description: `${name} has been removed.`,
      variant: "success",
    });
    router.refresh();
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await updateRecipient(id, { doNotSend: !currentStatus });
    toast({
      title: currentStatus ? "Recipient activated" : "Recipient deactivated",
      description: currentStatus
        ? "This recipient can now receive sends."
        : "This recipient will not receive any sends.",
      variant: "success",
    });
    router.refresh();
  };

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">Name</th>
            <th className="text-left py-3 px-4 font-medium">Email</th>
            <th className="text-left py-3 px-4 font-medium">Company</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Source</th>
            <th className="text-left py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((recipient) => {
            const displayName = [recipient.firstName, recipient.lastName]
              .filter(Boolean)
              .join(" ") || recipient.email;

            return (
              <tr key={recipient.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {recipient.firstName?.[0] || recipient.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">
                        {recipient.firstName} {recipient.lastName}
                      </div>
                      {recipient.jobTitle && (
                        <div className="text-muted-foreground text-xs">
                          {recipient.jobTitle}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {recipient.email}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {recipient.company ? (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {recipient.company}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {recipient.doNotSend ? (
                    <Badge variant="destructive" className="gap-1">
                      <Ban className="h-3 w-3" />
                      Do Not Send
                    </Badge>
                  ) : (
                    <Badge variant="default" className="gap-1">
                      <Send className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </td>
                <td className="py-3 px-4">
                  {recipient.externalSource ? (
                    <Badge variant="outline">{recipient.externalSource}</Badge>
                  ) : (
                    <Badge variant="secondary">Manual</Badge>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/sends/new?recipientId=${recipient.id}`}>
                      <Button size="sm" variant="default">
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                    </Link>
                    <RowActions
                      actions={[
                        createViewAction(`/recipients/${recipient.id}`),
                        createEditAction(`/recipients/${recipient.id}/edit`),
                        createSendAction(`/sends/new?recipientId=${recipient.id}`),
                        createToggleStatusAction(
                          !recipient.doNotSend,
                          () => handleToggleStatus(recipient.id, recipient.doNotSend)
                        ),
                        createDeleteAction(
                          () => handleDelete(recipient.id, displayName),
                          "recipient"
                        ),
                      ]}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
