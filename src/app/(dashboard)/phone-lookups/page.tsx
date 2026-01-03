import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
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
  Phone,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react';
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

function formatPhone(phone: string) {
  // Format E.164 phone number for display
  if (phone.startsWith('+1') && phone.length === 12) {
    const area = phone.slice(2, 5);
    const prefix = phone.slice(5, 8);
    const line = phone.slice(8);
    return `(${area}) ${prefix}-${line}`;
  }
  return phone;
}

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function PhoneLookupsPage({ searchParams }: PageProps) {
  // Server-side authorization check - admin only
  await requireAdmin();

  const params = await searchParams;
  const supabase = await createClient();

  const page = parseInt(params.page || '1', 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Get phone lookup logs with pagination
  const { data: lookups, count } = await supabase
    .from('phone_lookup_logs')
    .select(
      `
      id,
      searched_phone,
      normalized_phone,
      was_discoverable,
      created_at,
      finder:finder_id (
        id,
        full_name,
        email
      ),
      matched_user:matched_user_id (
        id,
        full_name,
        email
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Get all lookups for stats (minimal data)
  const { data: allLookups } = await supabase
    .from('phone_lookup_logs')
    .select('id, matched_user_id, was_discoverable, created_at');

  // Calculate metrics
  const totalLookups = allLookups?.length || 0;
  const matchedCount =
    allLookups?.filter((l) => l.matched_user_id !== null).length || 0;
  const discoverableCount =
    allLookups?.filter((l) => l.was_discoverable === true).length || 0;
  const notFoundCount =
    allLookups?.filter((l) => l.matched_user_id === null).length || 0;

  // Match rate
  const matchRate = totalLookups > 0 ? matchedCount / totalLookups : 0;

  // Lookups today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lookupsToday =
    allLookups?.filter((l) => new Date(l.created_at) >= today).length || 0;

  // Unique finders (calculate from paginated data)
  const { data: uniqueFinders } = await supabase
    .from('phone_lookup_logs')
    .select('finder_id')
    .limit(1000);
  const uniqueFinderCount = new Set(uniqueFinders?.map((f) => f.finder_id))
    .size;

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Phone Lookup Logs</h1>
        <p className="text-muted-foreground">
          Monitor phone number lookups from visual disc recovery
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lookups</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLookups}</div>
            <p className="text-xs text-muted-foreground">
              {lookupsToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(matchRate * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {matchedCount} matched, {notFoundCount} not found
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Discoverable Matches
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discoverableCount}</div>
            <p className="text-xs text-muted-foreground">
              Users with phone lookup enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Finders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueFinderCount}</div>
            <p className="text-xs text-muted-foreground">
              Users using phone lookup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Found & Discoverable</span>
            </div>
            <div className="text-2xl font-bold mt-2">{discoverableCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Found but Private</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {matchedCount - discoverableCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Not on Platform</span>
            </div>
            <div className="text-2xl font-bold mt-2">{notFoundCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lookup Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Phone Lookups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lookups && lookups.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Finder</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lookups.map((lookup) => {
                    const finder = lookup.finder as unknown as {
                      id: string;
                      full_name: string;
                      email: string;
                    } | null;
                    const matchedUser = lookup.matched_user as unknown as {
                      id: string;
                      full_name: string;
                      email: string;
                    } | null;

                    return (
                      <TableRow key={lookup.id}>
                        <TableCell className="font-mono">
                          {lookup.normalized_phone
                            ? formatPhone(lookup.normalized_phone)
                            : lookup.searched_phone}
                        </TableCell>
                        <TableCell>
                          {finder?.full_name || finder?.email || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {matchedUser ? (
                            <span className="text-green-600 dark:text-green-400">
                              {matchedUser.full_name || matchedUser.email}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Not found
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {matchedUser ? (
                            lookup.was_discoverable ? (
                              <Badge
                                variant="secondary"
                                className="gap-1 bg-green-100 text-green-800
                                  dark:bg-green-900 dark:text-green-200"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Discoverable
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="gap-1 bg-red-100 text-red-800
                                  dark:bg-red-900 dark:text-red-200"
                              >
                                <XCircle className="h-3 w-3" />
                                Private
                              </Badge>
                            )
                          ) : (
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-yellow-100 text-yellow-800
                                dark:bg-yellow-900 dark:text-yellow-200"
                            >
                              <Clock className="h-3 w-3" />
                              No Account
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(lookup.created_at)}
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
                itemsShown={lookups.length}
                itemName="phone lookups"
                basePath="/phone-lookups"
              />
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No phone lookups yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
