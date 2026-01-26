import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatsCardsSkeleton, TableSkeleton, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function RecipientsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <PageHeaderSkeleton />

      {/* Stats Cards Skeleton */}
      <StatsCardsSkeleton count={3} />

      {/* Search/Filter Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-[140px]" />
      </div>

      {/* Table Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={8} cols={6} />
        </CardContent>
      </Card>
    </div>
  );
}
