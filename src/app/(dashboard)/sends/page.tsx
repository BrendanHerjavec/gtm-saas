import { Suspense } from "react";
import { getSends, getSendStats } from "@/actions/sends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
    PENDING: { variant: "secondary", icon: Clock },
    PROCESSING: { variant: "outline", icon: Package },
    SHIPPED: { variant: "default", icon: Truck },
    DELIVERED: { variant: "default", icon: CheckCircle },
    FAILED: { variant: "destructive", icon: XCircle },
    CANCELLED: { variant: "secondary", icon: XCircle },
  };

  const config = statusConfig[status] || { variant: "secondary" as const, icon: Clock };
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

  return (
    <Badge variant="outline">
      {typeLabels[type] || type}
    </Badge>
  );
}

export default async function SendsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const [{ sends, total, page, totalPages }, stats] = await Promise.all([
    getSends({
      status: params.status as any,
      type: params.type as any,
      page: params.page ? parseInt(params.page) : 1,
    }),
    getSendStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sends</h1>
          <p className="text-muted-foreground">
            Track and manage all your gift sends and touches
          </p>
        </div>
        <Link href="/sends/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Send
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sends</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.shipped || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.delivered || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalSpent || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sends Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sends</CardTitle>
        </CardHeader>
        <CardContent>
          {sends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Send className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No sends yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first send
              </p>
              <Link href="/sends/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Send
                </Button>
              </Link>
            </div>
          ) : (
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
                  </tr>
                </thead>
                <tbody>
                  {sends.map((send) => (
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
                      <td className="py-3 px-4">
                        {send.giftItem?.name || "-"}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(send.status)}</td>
                      <td className="py-3 px-4">
                        {formatCurrency(send.totalCost)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(send.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
