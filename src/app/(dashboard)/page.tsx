import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, Disc, MapPin } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Printer users should go directly to orders
  if (user?.app_metadata?.role === 'printer') {
    redirect('/orders');
  }

  // Fetch dashboard stats
  const [ordersResult, usersResult, discsResult, recoveriesResult] =
    await Promise.all([
      supabase
        .from('sticker_orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['paid', 'processing']),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('discs')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('recovery_events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'recovered'),
    ]);

  const stats = [
    {
      title: 'Pending Orders',
      value: ordersResult.count ?? 0,
      icon: Package,
      description: 'Orders awaiting fulfillment',
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Discr Admin Dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
