import { StatsSkeleton } from '@/components/stats-skeleton';
import { TableSkeleton } from '@/components/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function SystemLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-36 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      <StatsSkeleton count={4} />

      {/* Notification Health */}
      <Skeleton className="h-[200px] w-full" />

      {/* Database Statistics */}
      <Skeleton className="h-8 w-40 mb-2" />
      <TableSkeleton columns={2} rows={7} />

      {/* External Services */}
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  );
}
