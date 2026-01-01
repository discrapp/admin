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
import { QrCode, CheckCircle, Clock, Link, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const statusColors: Record<string, string> = {
  generated: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  deactivated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusIcons: Record<string, React.ReactNode> = {
  generated: <Clock className="h-3 w-3" />,
  assigned: <Link className="h-3 w-3" />,
  active: <CheckCircle className="h-3 w-3" />,
  deactivated: <XCircle className="h-3 w-3" />,
};

export default async function QRCodesPage() {
  // Server-side authorization check - admin only
  await requireAdmin();

  const supabase = await createClient();

  // Get all QR codes for stats
  const { data: allQRCodes } = await supabase
    .from('qr_codes')
    .select('id, status');

  // Get recent QR codes with details
  const { data: recentQRCodes } = await supabase
    .from('qr_codes')
    .select('id, short_code, status, assigned_to, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50);

  // Calculate stats
  const totalQRCodes = allQRCodes?.length || 0;
  const generatedCount = allQRCodes?.filter((q) => q.status === 'generated').length || 0;
  const assignedCount = allQRCodes?.filter((q) => q.status === 'assigned').length || 0;
  const activeCount = allQRCodes?.filter((q) => q.status === 'active').length || 0;
  const deactivatedCount = allQRCodes?.filter((q) => q.status === 'deactivated').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QR Code Inventory</h1>
        <p className="text-muted-foreground">
          Track QR code generation and assignment
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQRCodes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Link className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedCount}</div>
            <p className="text-xs text-muted-foreground">To users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Linked to discs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deactivated</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deactivatedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* QR Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent QR Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentQRCodes && recentQRCodes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Short Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentQRCodes.map((qr) => (
                  <TableRow key={qr.id}>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {qr.short_code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`gap-1 ${statusColors[qr.status] || ''}`}
                      >
                        {statusIcons[qr.status]}
                        {qr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {qr.assigned_to ? (
                        <span className="text-sm font-mono">
                          {qr.assigned_to.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(qr.created_at)}</TableCell>
                    <TableCell>{formatDate(qr.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No QR codes found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
