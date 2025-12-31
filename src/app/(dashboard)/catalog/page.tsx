import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Disc, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { CatalogFilters } from './catalog-filters';

export const dynamic = 'force-dynamic';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const statusColors: Record<string, string> = {
  verified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  user_submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusIcons: Record<string, React.ReactNode> = {
  verified: <CheckCircle className="h-3 w-3" />,
  user_submitted: <Clock className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    category?: string;
    manufacturer?: string;
  }>;
}

export default async function DiscCatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Build query with filters
  let query = supabase
    .from('disc_catalog')
    .select('*')
    .order('manufacturer', { ascending: true })
    .order('mold', { ascending: true });

  if (params.search) {
    query = query.or(
      `manufacturer.ilike.%${params.search}%,mold.ilike.%${params.search}%`
    );
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.category) {
    query = query.eq('category', params.category);
  }

  if (params.manufacturer) {
    query = query.eq('manufacturer', params.manufacturer);
  }

  const { data: discs } = await query.limit(100);

  // Get counts by status
  const { data: allDiscs } = await supabase
    .from('disc_catalog')
    .select('status, category');

  const totalDiscs = allDiscs?.length || 0;
  const verifiedCount = allDiscs?.filter((d) => d.status === 'verified').length || 0;
  const pendingCount = allDiscs?.filter((d) => d.status === 'user_submitted').length || 0;
  const rejectedCount = allDiscs?.filter((d) => d.status === 'rejected').length || 0;

  // Get unique manufacturers and categories for filters
  const { data: manufacturerData } = await supabase
    .from('disc_catalog')
    .select('manufacturer')
    .order('manufacturer');

  const manufacturers = [...new Set(manufacturerData?.map((d) => d.manufacturer) || [])];

  const { data: categoryData } = await supabase
    .from('disc_catalog')
    .select('category')
    .not('category', 'is', null);

  const categories = [...new Set(categoryData?.map((d) => d.category).filter(Boolean) || [])];

  // Get recent sync logs
  const { data: syncLogs } = await supabase
    .from('disc_catalog_sync_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Disc Catalog</h1>
        <p className="text-muted-foreground">
          Manage the disc catalog database
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discs</CardTitle>
            <Disc className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDiscs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">Catalog ({discs?.length || 0})</TabsTrigger>
          <TabsTrigger value="sync">Sync History ({syncLogs?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          {/* Filters */}
          <CatalogFilters
            manufacturers={manufacturers}
            categories={categories}
            currentSearch={params.search}
            currentStatus={params.status}
            currentCategory={params.category}
            currentManufacturer={params.manufacturer}
          />

          {/* Catalog Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Disc Catalog
                {params.search || params.status || params.category || params.manufacturer ? (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (filtered)
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {discs && discs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Mold</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Flight Numbers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discs.map((disc) => (
                      <TableRow key={disc.id}>
                        <TableCell className="font-medium">
                          {disc.manufacturer}
                        </TableCell>
                        <TableCell>{disc.mold}</TableCell>
                        <TableCell>
                          {disc.category ? (
                            <Badge variant="outline">{disc.category}</Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {disc.speed !== null ? (
                            <span className="font-mono text-sm">
                              {disc.speed} / {disc.glide} / {disc.turn} / {disc.fade}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`gap-1 ${statusColors[disc.status] || ''}`}
                          >
                            {statusIcons[disc.status]}
                            {disc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {disc.source || '—'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No discs found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Sync History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syncLogs && syncLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Started</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Unchanged</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDateTime(log.started_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.source}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              log.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : log.status === 'failed'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-600">
                          +{log.discs_added}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          ~{log.discs_updated}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.discs_unchanged}
                        </TableCell>
                        <TableCell>
                          {log.completed_at
                            ? `${Math.round(
                                (new Date(log.completed_at).getTime() -
                                  new Date(log.started_at).getTime()) /
                                  1000
                              )}s`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No sync history yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
