import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  Users,
  Disc,
  MapPin,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';

// Helper to format dates for display
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Helper to get date range for last N days
function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
}

// Generate date labels for chart
function generateDateLabels(days: number): string[] {
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(formatDate(date));
  }
  return labels;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Printer users should go directly to orders
  if (user?.app_metadata?.role === 'printer') {
    redirect('/orders');
  }

  const { start: thirtyDaysAgo } = getDateRange(30);
  const { start: twentyFourHoursAgo } = getDateRange(1);

  // Fetch all dashboard data in parallel
  const [
    pendingOrdersResult,
    usersResult,
    discsResult,
    recoveriesResult,
    revenueResult,
    recentSignups,
    recentOrders,
    recentRecoveries,
    stuckOrders,
  ] = await Promise.all([
    // Pending orders count
    supabase
      .from('sticker_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['paid', 'processing']),
    // Total users count
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    // Total discs count
    supabase.from('discs').select('id', { count: 'exact', head: true }),
    // Successful recoveries count
    supabase
      .from('recovery_events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'recovered'),
    // Revenue (sum of completed orders)
    supabase
      .from('sticker_orders')
      .select('total_price_cents')
      .in('status', ['paid', 'processing', 'printed', 'shipped', 'delivered']),
    // Signups over last 30 days
    supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    // Orders over last 30 days
    supabase
      .from('sticker_orders')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    // Recoveries over last 30 days
    supabase
      .from('recovery_events')
      .select('created_at')
      .eq('status', 'recovered')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    // Stuck orders (processing for >24 hours)
    supabase
      .from('sticker_orders')
      .select('id, order_number, created_at, status')
      .eq('status', 'processing')
      .lt('updated_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: true })
      .limit(5),
  ]);

  // Calculate total revenue
  const totalRevenue =
    revenueResult.data?.reduce(
      (sum, order) => sum + (order.total_price_cents || 0),
      0
    ) ?? 0;

  // Process time series data for charts
  const dateLabels = generateDateLabels(30);

  const processTimeSeriesData = (
    records: { created_at: string }[] | null
  ): { date: string; value: number }[] => {
    const countsByDate: Record<string, number> = {};
    dateLabels.forEach((label) => (countsByDate[label] = 0));

    records?.forEach((record) => {
      const date = formatDate(new Date(record.created_at));
      if (countsByDate[date] !== undefined) {
        countsByDate[date]++;
      }
    });

    return dateLabels.map((date) => ({ date, value: countsByDate[date] }));
  };

  const signupsData = processTimeSeriesData(recentSignups.data);
  const ordersData = processTimeSeriesData(recentOrders.data);
  const recoveriesData = processTimeSeriesData(recentRecoveries.data);

  // Build alerts
  const alerts: {
    id: string;
    type: 'stuck_order' | 'failed_payment' | 'error';
    title: string;
    description: string;
    link?: string;
    timestamp: string;
  }[] = [];

  stuckOrders.data?.forEach((order) => {
    alerts.push({
      id: order.id,
      type: 'stuck_order',
      title: `Order ${order.order_number} stuck in processing`,
      description: `Status: ${order.status} - hasn't been updated in 24+ hours`,
      link: `/orders/${order.id}`,
      timestamp: new Date(order.created_at).toLocaleDateString(),
    });
  });

  const stats = [
    {
      title: 'Pending Orders',
      value: pendingOrdersResult.count ?? 0,
      icon: Package,
      description: 'Orders awaiting fulfillment',
    },
    {
      title: 'Total Revenue',
      value: `$${(totalRevenue / 100).toFixed(2)}`,
      icon: DollarSign,
      description: 'All time revenue',
    },
    {
      title: 'Total Users',
      value: usersResult.count ?? 0,
      icon: Users,
      description: 'Registered users',
    },
    {
      title: 'Total Discs',
      value: discsResult.count ?? 0,
      icon: Disc,
      description: 'Discs in the system',
    },
    {
      title: 'Successful Recoveries',
      value: recoveriesResult.count ?? 0,
      icon: MapPin,
      description: 'Discs returned to owners',
    },
    {
      title: 'Recovery Rate',
      value:
        discsResult.count && recoveriesResult.count
          ? `${((recoveriesResult.count / discsResult.count) * 100).toFixed(1)}%`
          : '0%',
      icon: TrendingUp,
      description: 'Of registered discs recovered',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Discr Admin Dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Last 30 Days</h2>
        <DashboardCharts
          signupsData={signupsData}
          ordersData={ordersData}
          recoveriesData={recoveriesData}
        />
      </div>

      {/* Alerts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">System Alerts</h2>
        <AlertsPanel alerts={alerts} />
      </div>
    </div>
  );
}
