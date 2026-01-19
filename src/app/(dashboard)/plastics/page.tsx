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
  Beaker,
  CheckCircle,
  Clock,
  Shield,
  Factory,
  User,
} from 'lucide-react';
import { PlasticFilters } from './plastic-filters';
import { PlasticActions } from './plastic-actions';
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
  official:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  approved:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pending:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

const statusIcons: Record<string, React.ReactNode> = {
  official: <Shield className="h-3 w-3" />,
  approved: <CheckCircle className="h-3 w-3" />,
  pending: <Clock className="h-3 w-3" />,
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    manufacturer?: string;
    page?: string;
  }>;
}

interface PlasticType {
  id: string;
  manufacturer: string;
  plastic_name: string;
  display_order: number;
  status: string;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
  submitter?: {
    email: string;
    full_name: string | null;
  } | null;
}

export default async function PlasticsPage({ searchParams }: PageProps) {
  // Server-side authorization check - admin only
  await requireAdmin();

  const params = await searchParams;
  const supabase = await createClient();

  const page = parseInt(params.page || '1', 10);
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  // Build query with filters and pagination
  let query = supabase
    .from('plastic_types')
    .select(
      `
      *,
      submitter:submitted_by (
        email,
        full_name
      )
    `,
      { count: 'exact' }
    )
    .order('manufacturer', { ascending: true })
    .order('display_order', { ascending: true })
    .order('plastic_name', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (params.search) {
    query = query.or(
      `manufacturer.ilike.%${params.search}%,plastic_name.ilike.%${params.search}%`
    );
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.manufacturer) {
    query = query.eq('manufacturer', params.manufacturer);
  }

  const { data: plastics, count } = (await query) as {
    data: PlasticType[] | null;
    count: number | null;
  };

  // Get counts by status
  const { data: allPlastics } = await supabase
    .from('plastic_types')
    .select('status');

  const totalPlastics = allPlastics?.length || 0;
  const officialCount =
    allPlastics?.filter((p) => p.status === 'official').length || 0;
  const approvedCount =
    allPlastics?.filter((p) => p.status === 'approved').length || 0;
  const pendingCount =
    allPlastics?.filter((p) => p.status === 'pending').length || 0;

  // Get unique manufacturers for filters
  const { data: manufacturerData } = await supabase
    .from('plastic_types')
    .select('manufacturer')
    .order('manufacturer');

  const manufacturers = [
    ...new Set(manufacturerData?.map((p) => p.manufacturer) || []),
  ];

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plastic Types</h1>
        <p className="text-muted-foreground">
          Manage plastic types for disc golf discs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plastics</CardTitle>
            <Beaker className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlastics}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Official</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{officialCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card className={pendingCount > 0 ? 'border-yellow-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            {pendingCount > 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Needs attention
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <PlasticFilters
        manufacturers={manufacturers}
        currentSearch={params.search}
        currentStatus={params.status}
        currentManufacturer={params.manufacturer}
      />

      {/* Plastics Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Plastic Types
            {params.search || params.status || params.manufacturer ? (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (filtered)
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plastics && plastics.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Plastic Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plastics.map((plastic) => (
                    <TableRow
                      key={plastic.id}
                      className={
                        plastic.status === 'pending'
                          ? 'bg-yellow-50 dark:bg-yellow-900/10'
                          : ''
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Factory className="h-4 w-4 text-muted-foreground" />
                          {plastic.manufacturer}
                        </div>
                      </TableCell>
                      <TableCell>{plastic.plastic_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`gap-1 ${statusColors[plastic.status] || ''}`}
                        >
                          {statusIcons[plastic.status]}
                          {plastic.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {plastic.submitter ? (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {plastic.submitter.full_name ||
                                plastic.submitter.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(plastic.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <PlasticActions
                          plasticId={plastic.id}
                          currentStatus={plastic.status}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalCount={count || 0}
                itemsShown={plastics.length}
                itemName="plastics"
                basePath="/plastics"
              />
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No plastic types found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
