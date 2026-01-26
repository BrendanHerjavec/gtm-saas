"use client";

import { useRouter } from "next/navigation";
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  RowActions,
  createViewAction,
  createDeleteAction,
} from "@/components/ui/row-actions";
import { cancelSend } from "@/actions/sends";
import { useToast } from "@/hooks/use-toast";

type Send = {
  id: string;
  type: string;
  status: string;
  totalCost: number;
  createdAt: Date;
  recipient: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  giftItem?: {
    id: string;
    name: string;
  } | null;
};

interface SendsTableProps {
  sends: Send[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getStatusBadge(status: string) {
  const statusConfig: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
  > = {
    PENDING: { variant: "secondary", icon: Clock },
    PROCESSING: { variant: "outline", icon: Package },
    SHIPPED: { variant: "default", icon: Truck },
    DELIVERED: { variant: "default", icon: CheckCircle },
    FAILED: { variant: "destructive", icon: XCircle },
    CANCELLED: { variant: "secondary", icon: XCircle },
  };

  const config = statusConfig[status] || {
    variant: "secondary" as const,
    icon: Clock,
  };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

function getTypeBadge(type: string) {
  const typeLabels: Record<string, string> = {
    GIFT: "Gift",
    HANDWRITTEN_NOTE: "Note",
    VIDEO: "Video",
    EXPERIENCE: "Experience",
    DIRECT_MAIL: "Direct Mail",
  };

  return <Badge variant="outline">{typeLabels[type] || type}</Badge>;
}

export function SendsTable({ sends }: SendsTableProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleCancel = async (id: string) => {
    await cancelSend(id);
    toast({
      title: "Send cancelled",
      description: "The send has been cancelled.",
      variant: "success",
    });
    router.refresh();
  };

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">Recipient</th>
            <th className="text-left py-3 px-4 font-medium">Type</th>
            <th className="text-left py-3 px-4 font-medium">Item</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Cost</th>
            <th className="text-left py-3 px-4 font-medium">Date</th>
            <th className="text-left py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sends.map((send) => {
            const canCancel = ["PENDING", "PROCESSING"].includes(send.status);

            return (
              <tr key={send.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium">
                      {send.recipient.firstName} {send.recipient.lastName}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {send.recipient.email}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">{getTypeBadge(send.type)}</td>
                <td className="py-3 px-4">{send.giftItem?.name || "-"}</td>
                <td className="py-3 px-4">{getStatusBadge(send.status)}</td>
                <td className="py-3 px-4">{formatCurrency(send.totalCost)}</td>
                <td className="py-3 px-4 text-muted-foreground">
                  {new Date(send.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <RowActions
                    actions={[
                      createViewAction(`/sends/${send.id}`),
                      ...(canCancel
                        ? [
                            {
                              label: "Cancel Send",
                              icon: <XCircle className="h-4 w-4" />,
                              onClick: () => handleCancel(send.id),
                              variant: "destructive" as const,
                              requiresConfirmation: true,
                              confirmTitle: "Cancel this send?",
                              confirmDescription:
                                "This will cancel the send. This action cannot be undone.",
                            },
                          ]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
