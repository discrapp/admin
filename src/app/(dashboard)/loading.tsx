import { StatsSkeleton } from '@/components/stats-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-40 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      <StatsSkeleton count={6} />

      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    </div>
  );
}
