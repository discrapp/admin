import { StatsSkeleton } from '@/components/stats-skeleton';
import { TableSkeleton } from '@/components/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function CatalogLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-5 w-56" />
      </div>

      <StatsSkeleton count={4} />

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Table skeleton */}
      <Skeleton className="h-8 w-32 mb-2" />
      <TableSkeleton columns={6} rows={10} />
    </div>
  );
}
