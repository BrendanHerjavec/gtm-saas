export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getRecipients } from "@/actions/recipients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserCircle,
  Plus,
  Mail,
  Building2,
  Send,
  Ban,
  Search,
} from "lucide-react";
import Link from "next/link";

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
            <div className="text-2xl font-bold">
              {recipients.filter((r) => !r.doNotSend).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Do Not Send</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recipients.filter((r) => r.doNotSend).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Link href="/recipients">
          <Button variant={!params.status ? "default" : "outline"} size="sm">
            All
          </Button>
        </Link>
        <Link href="/recipients?status=active">
          <Button variant={params.status === "active" ? "default" : "outline"} size="sm">
            Active
          </Button>
        </Link>
        <Link href="/recipients?status=do_not_send">
          <Button variant={params.status === "do_not_send" ? "default" : "outline"} size="sm">
            Do Not Send
          </Button>
        </Link>
      </div>

      {/* Recipients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Recipients</CardTitle>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No recipients yet</h3>
              <p className="text-muted-foreground mb-4">
                Add recipients manually or sync from your CRM
              </p>
              <div className="flex gap-2">
                <Link href="/recipients/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Recipient
                  </Button>
                </Link>
                <Link href="/integrations">
                  <Button variant="outline">
                    Connect CRM
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
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
                  {recipients.map((recipient) => (
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
                          <Badge variant="outline">
                            {recipient.externalSource}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Manual</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link href={`/sends/new?recipientId=${recipient.id}`}>
                            <Button size="sm" variant="default">
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                          </Link>
                          <Link href={`/recipients/${recipient.id}`}>
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/recipients?page=${p}${params.status ? `&status=${params.status}` : ""}`}
            >
              <Button
                variant={p === page ? "default" : "outline"}
                size="sm"
              >
                {p}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
