import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Mail,
  Calendar,
  CreditCard,
  Bell,
  Disc,
  Package,
  MapPin,
  Eye,
  Phone,
} from 'lucide-react';

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
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

const statusColors: Record<string, string> = {
  pending_payment:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  processing:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  printed:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  shipped: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  delivered:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const recoveryStatusColors: Record<string, string> = {
  found: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  meetup_proposed:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  confirmed:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  recovered:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Server-side authorization check - admin only
  await requireAdmin();

  const { id } = await params;
  const supabase = await createClient();

  // Fetch user profile
  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !user) {
    notFound();
  }

  // Fetch user's discs
  const { data: discs, error: discsError } = await supabase
    .from('discs')
    .select(
      `
      id,
      manufacturer,
      mold,
      color,
      plastic,
      weight,
      qr_code_id,
      created_at
    `
    )
    .eq('owner_id', id)
    .order('created_at', { ascending: false })
    .limit(10);


  // Fetch user's orders
  const { data: orders } = await supabase
    .from('sticker_orders')
    .select('id, order_number, status, quantity, total_price_cents, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch recovery events where user is the owner
  const { data: recoveriesAsOwner } = await supabase
    .from('recovery_events')
    .select(
      `
      id,
      status,
      created_at,
      discs:disc_id (
        manufacturer,
        mold
      )
    `
    )
    .eq('owner_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch recovery events where user is the finder
  const { data: recoveriesAsFinder } = await supabase
    .from('recovery_events')
    .select(
      `
      id,
      status,
      created_at,
      discs:disc_id (
        manufacturer,
        mold
      )
    `
    )
    .eq('finder_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(user.full_name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {user.full_name || 'No name'}
                </h1>
                {user.username && (
                  <p className="text-muted-foreground">@{user.username}</p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Joined {formatDate(user.created_at)}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {user.phone_number ? (
                    <span className="font-mono text-xs">
                      {user.phone_number}
                      {user.phone_discoverable && (
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-green-100 text-green-800
                            dark:bg-green-900 dark:text-green-200"
                        >
                          Discoverable
                        </Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No phone</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  {user.stripe_connect_account_id ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      Stripe Connect Active
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">
                      No Stripe Connect
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  {user.push_token ? (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      Push Enabled
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">
                      Push Disabled
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discs</CardTitle>
            <Disc className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discs?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recoveries</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(recoveriesAsOwner?.length || 0) +
                (recoveriesAsFinder?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {recoveriesAsOwner?.length || 0} as owner,{' '}
              {recoveriesAsFinder?.length || 0} as finder
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for related data */}
      <Tabs defaultValue="discs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="discs">
            Discs ({discs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="orders">
            Orders ({orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="recoveries">
            Recoveries (
            {(recoveriesAsOwner?.length || 0) +
              (recoveriesAsFinder?.length || 0)}
            )
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discs">
          <Card>
            <CardHeader>
              <CardTitle>Registered Discs</CardTitle>
            </CardHeader>
            <CardContent>
              {discs && discs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disc</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Plastic</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>QR</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discs.map((disc) => (
                      <TableRow key={disc.id}>
                        <TableCell className="font-medium">
                          {disc.manufacturer} {disc.mold}
                        </TableCell>
                        <TableCell>{disc.color || '—'}</TableCell>
                        <TableCell>{disc.plastic || '—'}</TableCell>
                        <TableCell>
                          {disc.weight ? `${disc.weight}g` : '—'}
                        </TableCell>
                        <TableCell>
                          {disc.qr_code_id ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            >
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(disc.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No discs registered
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>{order.quantity} stickers</TableCell>
                        <TableCell>
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
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
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
        </TabsContent>

        <TabsContent value="recoveries">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recoveries as Owner</CardTitle>
              </CardHeader>
              <CardContent>
                {recoveriesAsOwner && recoveriesAsOwner.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disc</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recoveriesAsOwner.map((recovery) => (
                        <TableRow key={recovery.id}>
                          <TableCell className="font-medium">
                            {recovery.discs
                              ? `${(recovery.discs as unknown as { manufacturer: string; mold: string }).manufacturer} ${(recovery.discs as unknown as { manufacturer: string; mold: string }).mold}`
                              : 'Unknown disc'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                recoveryStatusColors[recovery.status] || ''
                              }
                            >
                              {recovery.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDateTime(recovery.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No recoveries as owner
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recoveries as Finder</CardTitle>
              </CardHeader>
              <CardContent>
                {recoveriesAsFinder && recoveriesAsFinder.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disc</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recoveriesAsFinder.map((recovery) => (
                        <TableRow key={recovery.id}>
                          <TableCell className="font-medium">
                            {recovery.discs
                              ? `${(recovery.discs as unknown as { manufacturer: string; mold: string }).manufacturer} ${(recovery.discs as unknown as { manufacturer: string; mold: string }).mold}`
                              : 'Unknown disc'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                recoveryStatusColors[recovery.status] || ''
                              }
                            >
                              {recovery.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDateTime(recovery.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No recoveries as finder
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
