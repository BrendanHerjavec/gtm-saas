export const dynamic = "force-dynamic";

import { getSends, getSendStats } from "@/actions/sends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchFilter } from "@/components/ui/search-filter";
import { Pagination } from "@/components/ui/pagination";
import { SendsTable } from "@/components/features/sends/sends-table";
import {
  Send,
  Truck,
  CheckCircle,
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

const statusFilters = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const typeFilters = [
  { value: "GIFT", label: "Gift" },
  { value: "HANDWRITTEN_NOTE", label: "Note" },
  { value: "VIDEO", label: "Video" },
  { value: "EXPERIENCE", label: "Experience" },
  { value: "DIRECT_MAIL", label: "Direct Mail" },
];

export default async function SendsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const [{ sends, total, page, totalPages }, stats] = await Promise.all([
    getSends({
      status: params.status as any,
      type: params.type as any,
      search: params.search,
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

      {/* Search and Filters */}
      <SearchFilter
        searchPlaceholder="Search by recipient name or email..."
        filters={[
          { key: "status", label: "Status", options: statusFilters },
          { key: "type", label: "Type", options: typeFilters },
        ]}
      />

      {/* Sends Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {params.search || params.status || params.type ? "Filtered Results" : "Recent Sends"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Send className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                {params.search || params.status || params.type
                  ? "No matching sends"
                  : "No sends yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {params.search || params.status || params.type
                  ? "Try adjusting your filters"
                  : "Start by creating your first send"}
              </p>
              {!params.search && !params.status && !params.type && (
                <Link href="/sends/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Send
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <SendsTable sends={sends} />

              {/* Pagination */}
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                className="mt-4 pt-4 border-t"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
