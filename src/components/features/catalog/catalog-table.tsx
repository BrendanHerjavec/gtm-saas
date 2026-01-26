"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Monitor,
  Sparkles,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RowActions,
  createViewAction,
  createEditAction,
  createDeleteAction,
} from "@/components/ui/row-actions";
import { deleteGiftItem, updateGiftItem } from "@/actions/catalog";
import { useToast } from "@/hooks/use-toast";

type GiftItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  type: string;
  inStock: boolean;
  isActive: boolean;
  category: { id: string; name: string } | null;
  vendor: { id: string; name: string } | null;
};

interface CatalogTableProps {
  items: GiftItem[];
}

function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

const typeConfig: Record<string, { icon: any; label: string }> = {
  PHYSICAL: { icon: Package, label: "Physical" },
  DIGITAL: { icon: Monitor, label: "Digital" },
  EXPERIENCE: { icon: Sparkles, label: "Experience" },
};

export function CatalogTable({ items }: CatalogTableProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (id: string, name: string) => {
    await deleteGiftItem(id);
    toast({
      title: "Item deleted",
      description: `"${name}" has been removed from your catalog.`,
      variant: "success",
    });
    router.refresh();
  };

  const handleToggleStock = async (id: string, currentStatus: boolean) => {
    await updateGiftItem(id, { inStock: !currentStatus });
    toast({
      title: currentStatus ? "Marked out of stock" : "Marked in stock",
      description: `Item availability has been updated.`,
      variant: "success",
    });
    router.refresh();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await updateGiftItem(id, { isActive: !currentStatus });
    toast({
      title: currentStatus ? "Item hidden" : "Item visible",
      description: `Item visibility has been updated.`,
      variant: "success",
    });
    router.refresh();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const type = typeConfig[item.type] || typeConfig.PHYSICAL;
          const TypeIcon = type.icon;

          return (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <TypeIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/catalog/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {type.label}
                </Badge>
              </TableCell>
              <TableCell>
                {item.category ? (
                  <span className="text-sm">{item.category.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {formatCurrency(item.price, item.currency)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge
                    variant={item.inStock ? "default" : "secondary"}
                    className="gap-1 w-fit"
                  >
                    {item.inStock ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {item.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                  {!item.isActive && (
                    <Badge variant="outline" className="w-fit text-xs">
                      Hidden
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <RowActions
                  actions={[
                    createViewAction(`/catalog/${item.id}`),
                    createEditAction(`/catalog/${item.id}/edit`),
                    {
                      label: item.inStock ? "Mark Out of Stock" : "Mark In Stock",
                      icon: item.inStock ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      ),
                      onClick: () => handleToggleStock(item.id, item.inStock),
                    },
                    {
                      label: item.isActive ? "Hide from Catalog" : "Show in Catalog",
                      icon: item.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      ),
                      onClick: () => handleToggleActive(item.id, item.isActive),
                    },
                    createDeleteAction(
                      () => handleDelete(item.id, item.name),
                      "gift item"
                    ),
                  ]}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
