export const dynamic = "force-dynamic";

import { getRecipients } from "@/actions/recipients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchFilter } from "@/components/ui/search-filter";
import { Pagination } from "@/components/ui/pagination";
import { RecipientsTable } from "@/components/features/recipients/recipients-table";
import { UserCircle, Plus, Send, Ban } from "lucide-react";
import Link from "next/link";

const statusFilters = [
  { value: "active", label: "Active" },
  { value: "do_not_send", label: "Do Not Send" },
];

export default async function RecipientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { recipients, total, page, totalPages } = await getRecipients({
    status: params.status as any,
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
  });

  // Calculate stats from all recipients (not just current page)
  const activeCount = recipients.filter((r) => !r.doNotSend).length;
  const doNotSendCount = recipients.filter((r) => r.doNotSend).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipients</h1>
          <p className="text-muted-foreground">
            Manage people who receive your gifts and personalized touches
          </p>
        </div>
        <Link href="/recipients/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Recipient
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Send className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Do Not Send</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doNotSendCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <SearchFilter
        searchPlaceholder="Search by name, email, or company..."
        filters={[{ key: "status", label: "Status", options: statusFilters }]}
      />

      {/* Recipients Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {params.search || params.status ? "Filtered Results" : "All Recipients"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                {params.search || params.status
                  ? "No matching recipients"
                  : "No recipients yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {params.search || params.status
                  ? "Try adjusting your filters"
                  : "Add recipients manually or sync from your CRM"}
              </p>
              {!params.search && !params.status && (
                <div className="flex gap-2">
                  <Link href="/recipients/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Recipient
                    </Button>
                  </Link>
                  <Link href="/integrations">
                    <Button variant="outline">Connect CRM</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <RecipientsTable recipients={recipients} />

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
