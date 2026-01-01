import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Calendar,
  Users,
} from 'lucide-react';
import { RecoveryFilters } from './recovery-filters';
import { Pagination } from '@/components/pagination';

export const dynamic = 'force-dynamic';

function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const statusColors: Record<string, string> = {
  found: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  meetup_proposed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  meetup_confirmed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  recovered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusIcons: Record<string, React.ReactNode> = {
  found: <MapPin className="h-3 w-3" />,
  meetup_proposed: <Calendar className="h-3 w-3" />,
  meetup_confirmed: <Users className="h-3 w-3" />,
  recovered: <CheckCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

export default async function RecoveriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const page = parseInt(params.page || '1', 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Build query with filters and pagination
  let query = supabase
    .from('recovery_events')
    .select(
      `
      id,
      status,
      finder_message,
      found_at,
      recovered_at,
      created_at,
      discs:disc_id (
        id,
        manufacturer,
        mold,
        owner_id
      ),
      finder:finder_id (
        id,
        full_name,
        email
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data: recoveries, count } = await query;

  // Get all recoveries for stats (only status needed)
  const { data: allRecoveries } = await supabase
    .from('recovery_events')
    .select('id, status, found_at, recovered_at');

  // Calculate metrics
  const totalRecoveries = allRecoveries?.length || 0;
  const foundCount =
    allRecoveries?.filter((r) => r.status === 'found').length || 0;
  const meetupProposedCount =
    allRecoveries?.filter((r) => r.status === 'meetup_proposed').length || 0;
  const meetupConfirmedCount =
    allRecoveries?.filter((r) => r.status === 'meetup_confirmed').length || 0;
  const recoveredCount =
    allRecoveries?.filter((r) => r.status === 'recovered').length || 0;
  const cancelledCount =
    allRecoveries?.filter((r) => r.status === 'cancelled').length || 0;

  // Success rate (recovered / total non-cancelled)
  const completedOrCancelled = recoveredCount + cancelledCount;
  const successRate =
    completedOrCancelled > 0 ? recoveredCount / completedOrCancelled : 0;

  // Average time to recovery (for recovered events)
  const recoveredEvents =
    allRecoveries?.filter(
      (r) => r.status === 'recovered' && r.recovered_at && r.found_at
    ) || [];
  const avgRecoveryTimeHours =
    recoveredEvents.length > 0
      ? recoveredEvents.reduce((sum, r) => {
          const found = new Date(r.found_at).getTime();
          const recovered = new Date(r.recovered_at!).getTime();
          return sum + (recovered - found) / (1000 * 60 * 60);
        }, 0) / recoveredEvents.length
      : 0;

  // Active recoveries (not recovered or cancelled)
  const activeCount = foundCount + meetupProposedCount + meetupConfirmedCount;

  // Stuck recoveries (found status for >7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const stuckCount =
    allRecoveries?.filter(
      (r) => r.status === 'found' && new Date(r.found_at) < sevenDaysAgo
    ).length || 0;

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recovery Events</h1>
        <p className="text-muted-foreground">
          Monitor disc recovery system and success rates
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Recoveries
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecoveries}</div>
            <p className="text-xs text-muted-foreground">
              {activeCount} active, {recoveredCount} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(successRate * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {recoveredCount} recovered, {cancelledCount} cancelled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Recovery Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgRecoveryTimeHours > 0
                ? avgRecoveryTimeHours < 24
                  ? `${Math.round(avgRecoveryTimeHours)}h`
                  : `${Math.round(avgRecoveryTimeHours / 24)}d`
                : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              From found to recovered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stuck Recoveries
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stuckCount}</div>
            <p className="text-xs text-muted-foreground">
              No activity &gt;7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Found</span>
            </div>
            <div className="text-2xl font-bold mt-2">{foundCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Meetup Proposed</span>
            </div>
            <div className="text-2xl font-bold mt-2">{meetupProposedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Confirmed</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {meetupConfirmedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Recovered</span>
            </div>
            <div className="text-2xl font-bold mt-2">{recoveredCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Cancelled</span>
            </div>
            <div className="text-2xl font-bold mt-2">{cancelledCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <RecoveryFilters currentStatus={params.status} />

      {/* Recovery Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Recovery Events
            {params.status && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (filtered by {params.status})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recoveries && recoveries.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disc</TableHead>
                    <TableHead>Finder</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Found</TableHead>
                    <TableHead>Recovered</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recoveries.map((recovery) => {
                    const disc = recovery.discs as unknown as {
                      id: string;
                      manufacturer: string;
                      mold: string;
                    } | null;
                    const finder = recovery.finder as unknown as {
                      id: string;
                      full_name: string;
                      email: string;
                    } | null;

                    return (
                      <TableRow key={recovery.id}>
                        <TableCell className="font-medium">
                          {disc ? `${disc.manufacturer} ${disc.mold}` : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {finder?.full_name || finder?.email || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`gap-1 ${statusColors[recovery.status] || ''}`}
                          >
                            {statusIcons[recovery.status]}
                            {recovery.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(recovery.found_at)}</TableCell>
                        <TableCell>
                          {recovery.recovered_at
                            ? formatDateTime(recovery.recovered_at)
                            : '—'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {recovery.finder_message || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalCount={count || 0}
                itemsShown={recoveries.length}
                itemName="recovery events"
                basePath="/recoveries"
              />
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No recovery events found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
