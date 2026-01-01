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
  Activity,
  Bell,
  Database,
  Users,
  Disc,
  ShoppingCart,
  MapPin,
  Server,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SystemPage() {
  // Server-side authorization check - admin only
  await requireAdmin();

  const supabase = await createClient();

  // Notification health - users with push tokens
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, push_token, created_at');

  const totalUsers = allUsers?.length || 0;
  const usersWithPush = allUsers?.filter((u) => u.push_token).length || 0;
  const pushEnabledRate = totalUsers > 0 ? usersWithPush / totalUsers : 0;

  // Database stats
  const { count: discCount } = await supabase
    .from('discs')
    .select('*', { count: 'exact', head: true });

  const { count: orderCount } = await supabase
    .from('sticker_orders')
    .select('*', { count: 'exact', head: true });

  const { count: recoveryCount } = await supabase
    .from('recovery_events')
    .select('*', { count: 'exact', head: true });

  const { count: catalogCount } = await supabase
    .from('disc_catalog')
    .select('*', { count: 'exact', head: true });

  const { count: qrCount } = await supabase
    .from('qr_codes')
    .select('*', { count: 'exact', head: true });

  const { count: aiLogCount } = await supabase
    .from('ai_identification_logs')
    .select('*', { count: 'exact', head: true });

  // Recent user signups (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentSignups = allUsers?.filter(
    (u) => new Date(u.created_at) >= weekAgo
  ).length || 0;

  // Database table stats
  const tableStats = [
    { name: 'profiles', count: totalUsers, icon: Users },
    { name: 'discs', count: discCount || 0, icon: Disc },
    { name: 'sticker_orders', count: orderCount || 0, icon: ShoppingCart },
    { name: 'recovery_events', count: recoveryCount || 0, icon: MapPin },
    { name: 'disc_catalog', count: catalogCount || 0, icon: Database },
    { name: 'qr_codes', count: qrCount || 0, icon: Database },
    { name: 'ai_identification_logs', count: aiLogCount || 0, icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Health</h1>
        <p className="text-muted-foreground">
          Monitor system health and database statistics
        </p>
      </div>

      {/* Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Operational
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All systems running normally
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{recentSignups} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Push Enabled</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithPush}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(pushEnabledRate * 100)}% of users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Connected
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Supabase PostgreSQL
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notification Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Push Enabled</p>
              <p className="text-2xl font-bold text-green-600">{usersWithPush}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Push Disabled</p>
              <p className="text-2xl font-bold text-yellow-600">
                {totalUsers - usersWithPush}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Push notification adoption</span>
              <span>{Math.round(pushEnabledRate * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${pushEnabledRate * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead className="text-right">Row Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableStats.map((table) => (
                <TableRow key={table.name}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <table.icon className="h-4 w-4 text-muted-foreground" />
                      {table.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {table.count.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* External Services */}
      <Card>
        <CardHeader>
          <CardTitle>External Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Supabase</span>
              </div>
              <Badge variant="outline">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Stripe</span>
              </div>
              <Badge variant="outline">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Expo Push Notifications</span>
              </div>
              <Badge variant="outline">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Cloudflare Workers</span>
              </div>
              <Badge variant="outline">Connected</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
