export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Package,
  Monitor,
  Sparkles,
  DollarSign,
  Tag,
  Building2,
  CheckCircle,
  XCircle,
  Calendar,
  Barcode,
  MapPin,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getGiftItem } from "@/actions/catalog";

interface GiftItemDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

const typeConfig: Record<string, { icon: any; label: string }> = {
  PHYSICAL: { icon: Package, label: "Physical Item" },
  DIGITAL: { icon: Monitor, label: "Digital Item" },
  EXPERIENCE: { icon: Sparkles, label: "Experience" },
};

export default async function GiftItemDetailPage({ params }: GiftItemDetailPageProps) {
  const { id } = await params;
  const giftItem = await getGiftItem(id);

  if (!giftItem) {
    notFound();
  }

  const type = typeConfig[giftItem.type] || typeConfig.PHYSICAL;
  const TypeIcon = type.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/catalog">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {giftItem.imageUrl ? (
              <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden">
                <img
                  src={giftItem.imageUrl}
                  alt={giftItem.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                <TypeIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{giftItem.name}</h1>
                <Badge variant={giftItem.inStock ? "default" : "secondary"} className="gap-1">
                  {giftItem.inStock ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {giftItem.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
                {!giftItem.isActive && (
                  <Badge variant="outline">Hidden</Badge>
                )}
              </div>
              <p className="text-2xl font-semibold text-primary">
                {formatCurrency(giftItem.price, giftItem.currency)}
              </p>
            </div>
          </div>
        </div>
        <Link href={`/catalog/items/${giftItem.id}/edit`}>
          <Button className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit Item
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5" />
              Item Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge variant="outline" className="gap-1 mt-1">
                <TypeIcon className="h-3 w-3" />
                {type.label}
              </Badge>
            </div>

            {giftItem.description && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1 whitespace-pre-line">{giftItem.description}</p>
                </div>
              </>
            )}

            {giftItem.sku && (
              <>
                <Separator />
                <div className="flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-mono">{giftItem.sku}</p>
                  </div>
                </div>
              </>
            )}

            {giftItem.type === "EXPERIENCE" && (
              <>
                {giftItem.duration && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p>{giftItem.duration}</p>
                      </div>
                    </div>
                  </>
                )}

                {giftItem.location && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p>{giftItem.location}</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {giftItem.category && (
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <Badge variant="secondary" className="mt-1">
                  {giftItem.category.name}
                </Badge>
              </div>
            )}

            {giftItem.vendor && (
              <>
                <Separator />
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p>{giftItem.vendor.name}</p>
                  </div>
                </div>
              </>
            )}

            {giftItem.tags && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {giftItem.tags.split(",").map((tag) => (
                      <Badge key={tag.trim()} variant="outline">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Added</p>
                <p>{new Date(giftItem.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(giftItem.price, giftItem.currency)}
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="font-medium">{giftItem.currency}</p>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Availability</span>
              <Badge variant={giftItem.inStock ? "default" : "secondary"} className="gap-1">
                {giftItem.inStock ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {giftItem.inStock ? "In Stock" : "Out of Stock"}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Visibility</span>
              <Badge variant={giftItem.isActive ? "default" : "outline"} className="gap-1">
                {giftItem.isActive ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {giftItem.isActive ? "Visible" : "Hidden"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
