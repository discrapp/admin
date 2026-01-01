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
import { DollarSign, TrendingUp, CreditCard, AlertTriangle, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

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
  pending_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  printed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  shipped: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default async function PaymentsPage() {
  // Server-side authorization check - admin only
  await requireAdmin();

  const supabase = await createClient();

  // Get all orders for stats
  const { data: allOrders } = await supabase
    .from('sticker_orders')
    .select('id, status, total_price_cents, created_at');

  // Get recent paid orders
  const { data: recentOrders } = await supabase
    .from('sticker_orders')
    .select('id, order_number, status, quantity, total_price_cents, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  // Get users with Stripe Connect
  const { data: connectUsers } = await supabase
    .from('profiles')
    .select('id, stripe_connect_account_id')
    .not('stripe_connect_account_id', 'is', null);

  // Calculate revenue stats
  const paidStatuses = ['paid', 'processing', 'printed', 'shipped', 'delivered'];
  const paidOrders = allOrders?.filter((o) => paidStatuses.includes(o.status)) || [];
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_price_cents || 0), 0);

  // Calculate today's revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = paidOrders.filter((o) => new Date(o.created_at) >= today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total_price_cents || 0), 0);

  // Calculate this week's revenue
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekOrders = paidOrders.filter((o) => new Date(o.created_at) >= weekAgo);
  const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.total_price_cents || 0), 0);

  // Calculate this month's revenue
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthOrders = paidOrders.filter((o) => new Date(o.created_at) >= monthAgo);
  const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total_price_cents || 0), 0);

  // Failed/pending payments
  const pendingPayments = allOrders?.filter((o) => o.status === 'pending_payment') || [];
  const cancelledOrders = allOrders?.filter((o) => o.status === 'cancelled') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Monitoring</h1>
        <p className="text-muted-foreground">
          Track revenue and payment status
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {paidOrders.length} paid orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {todayOrders.length} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weekRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {weekOrders.length} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {monthOrders.length} orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cancelledOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              Cancelled orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stripe Connect</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectUsers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users with Connect accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders && recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>{order.quantity} stickers</TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(order.total_price_cents)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[order.status] || ''}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(order.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No orders found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
