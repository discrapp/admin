import { TableSkeleton } from '@/components/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function QRCodesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-44 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      {/* QR Codes Table */}
      <Skeleton className="h-8 w-36 mb-2" />
      <TableSkeleton columns={5} rows={10} />
    </div>
  );
}
