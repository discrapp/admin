import { StatsSkeleton } from '@/components/stats-skeleton';
import { TableSkeleton } from '@/components/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecoveriesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      <StatsSkeleton count={4} />

      {/* Status breakdown skeleton */}
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      {/* Filters skeleton */}
      <Skeleton className="h-10 w-40" />

      {/* Table skeleton */}
      <Skeleton className="h-8 w-40 mb-2" />
      <TableSkeleton columns={6} rows={10} />
    </div>
  );
}
