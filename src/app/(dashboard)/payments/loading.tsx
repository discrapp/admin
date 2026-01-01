import { StatsSkeleton } from '@/components/stats-skeleton';
import { TableSkeleton } from '@/components/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-56" />
      </div>

      {/* Revenue Stats */}
      <StatsSkeleton count={4} />

      {/* Payment Status */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      {/* Recent Transactions */}
      <Skeleton className="h-8 w-36 mb-2" />
      <TableSkeleton columns={5} rows={10} />
    </div>
  );
}
