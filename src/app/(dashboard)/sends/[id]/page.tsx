export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  User,
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  DollarSign,
  Calendar,
  MessageSquare,
  FileText,
  Video,
  MapPin,
  Building2,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSend } from "@/actions/sends";

interface SendDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any; label: string }> = {
  PENDING: { variant: "secondary", icon: Clock, label: "Pending" },
  PROCESSING: { variant: "outline", icon: Package, label: "Processing" },
  SHIPPED: { variant: "default", icon: Truck, label: "Shipped" },
  DELIVERED: { variant: "default", icon: CheckCircle, label: "Delivered" },
  FAILED: { variant: "destructive", icon: XCircle, label: "Failed" },
  CANCELLED: { variant: "secondary", icon: XCircle, label: "Cancelled" },
};

const typeConfig: Record<string, { icon: any; label: string }> = {
  GIFT: { icon: Gift, label: "Physical Gift" },
  HANDWRITTEN_NOTE: { icon: FileText, label: "Handwritten Note" },
  VIDEO: { icon: Video, label: "Video Message" },
  EXPERIENCE: { icon: Calendar, label: "Experience" },
  DIRECT_MAIL: { icon: Mail, label: "Direct Mail" },
};

export default async function SendDetailPage({ params }: SendDetailPageProps) {
  const { id } = await params;
  const send = await getSend(id);

  if (!send) {
    notFound();
  }

  const status = statusConfig[send.status] || statusConfig.PENDING;
  const type = typeConfig[send.type] || typeConfig.GIFT;
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sends">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Send Details
              </h1>
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Created on {formatDate(send.createdAt)}
            </p>
          </div>
        </div>
        {(send.status === "PENDING" || send.status === "PROCESSING") && (
          <Button variant="destructive">Cancel Send</Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Send Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5" />
              {type.label}
            </CardTitle>
            <CardDescription>Send details and tracking information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={status.variant} className="gap-1 mt-1">
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{type.label}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Item Cost</p>
                <p className="font-medium">{formatCurrency(send.itemCost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="font-medium text-lg">{formatCurrency(send.totalCost)}</p>
              </div>
            </div>

            {send.trackingNumber && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Tracking Number</p>
                  <p className="font-mono">{send.trackingNumber}</p>
                </div>
              </>
            )}

            {send.scheduledAt && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled For</p>
                  <p className="font-medium">{formatDateTime(send.scheduledAt)}</p>
                </div>
              </>
            )}

            {send.shippedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Shipped At</p>
                <p className="font-medium">{formatDateTime(send.shippedAt)}</p>
              </div>
            )}

            {send.deliveredAt && (
              <div>
                <p className="text-sm text-muted-foreground">Delivered At</p>
                <p className="font-medium">{formatDateTime(send.deliveredAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recipient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Recipient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {send.recipient.firstName?.[0] || send.recipient.email[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {send.recipient.firstName} {send.recipient.lastName}
                </p>
                <p className="text-muted-foreground">{send.recipient.email}</p>
              </div>
            </div>

            {(send.recipient.company || send.recipient.jobTitle) && (
              <>
                <Separator />
                <div className="space-y-2">
                  {send.recipient.company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{send.recipient.company}</span>
                    </div>
                  )}
                  {send.recipient.jobTitle && (
                    <p className="text-muted-foreground">{send.recipient.jobTitle}</p>
                  )}
                </div>
              </>
            )}

            {send.shippingAddress && (
              <>
                <Separator />
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Shipping Address</p>
                    <p className="whitespace-pre-line">{send.shippingAddress}</p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <Link href={`/recipients/${send.recipient.id}`}>
              <Button variant="outline" className="w-full">
                View Recipient Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Gift Item */}
        {send.giftItem && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Gift Item
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {send.giftItem.imageUrl ? (
                  <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden">
                    <img
                      src={send.giftItem.imageUrl}
                      alt={send.giftItem.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                    <Gift className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{send.giftItem.name}</p>
                  <p className="text-lg font-medium text-primary">
                    {formatCurrency(send.giftItem.price)}
                  </p>
                </div>
              </div>

              {send.giftItem.description && (
                <>
                  <Separator />
                  <p className="text-muted-foreground">{send.giftItem.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Message */}
        {(send.message || send.notes) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Message & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {send.message && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Personal Message</p>
                  <p className="whitespace-pre-line bg-muted/50 p-3 rounded-lg">
                    {send.message}
                  </p>
                </div>
              )}

              {send.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Internal Notes</p>
                  <p className="whitespace-pre-line text-muted-foreground">
                    {send.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Campaign */}
        {send.campaign && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/campaigns/${send.campaign.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{send.campaign.name}</p>
                  <p className="text-sm text-muted-foreground">
                    View campaign details
                  </p>
                </div>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Activity Timeline */}
        {send.activities && send.activities.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {send.activities.map((activity: any, index: number) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {index < send.activities.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(activity.createdAt)}
                      </p>
                      {activity.description && (
                        <p className="text-sm mt-1">{activity.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
