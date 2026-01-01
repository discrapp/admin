import { TableSkeleton } from '@/components/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-24 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-64" />
      </div>

      <TableSkeleton columns={7} rows={10} />

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}
