import { StatsSkeleton } from '@/components/stats-skeleton';
import { TableSkeleton } from '@/components/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function AIInsightsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Identification Metrics */}
      <div>
        <Skeleton className="h-6 w-40 mb-4" />
        <StatsSkeleton count={4} />
      </div>

      {/* Shot Recommendation Metrics */}
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <StatsSkeleton count={4} />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>

      <TableSkeleton columns={6} rows={10} />
    </div>
  );
}
