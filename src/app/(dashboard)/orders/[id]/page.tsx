import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { OrderStatusUpdater } from './order-status-updater';
import { OrderTimeline } from './order-timeline';

interface OrderPageProps {
  params: Promise<{ id: string }>;
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

const statusLabels: Record<string, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  processing: 'Processing',
  printed: 'Printed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
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

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('sticker_orders')
    .select(
      `
      *,
      profiles:user_id (
        id,
        email,
        full_name,
        username
      ),
      shipping_addresses:shipping_address_id (
        name,
        street_address,
        city,
        state,
        postal_code,
        country
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !order) {
    notFound();
  }

  // Get PDF URL if exists
  let pdfUrl: string | null = null;
  if (order.pdf_storage_path) {
    const { data: urlData } = await supabase.storage
      .from('sticker-pdfs')
      .createSignedUrl(order.pdf_storage_path, 3600); // 1 hour expiry
    pdfUrl = urlData?.signedUrl || null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
          <p className="text-muted-foreground">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={`text-sm ${statusColors[order.status] || ''}`}
        >
          {statusLabels[order.status] || order.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Name: </span>
              <span className="font-medium">
                {order.profiles?.full_name ||
                  order.profiles?.username ||
                  'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Email: </span>
              <span className="font-medium">{order.profiles?.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            {order.shipping_addresses ? (
              <address className="not-italic space-y-1">
                <div className="font-medium">{order.shipping_addresses.name}</div>
                <div>{order.shipping_addresses.street_address}</div>
                <div>
                  {order.shipping_addresses.city}, {order.shipping_addresses.state}{' '}
                  {order.shipping_addresses.postal_code}
                </div>
                <div>{order.shipping_addresses.country}</div>
              </address>
            ) : (
              <p className="text-muted-foreground">No shipping address</p>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-medium">{order.quantity} stickers</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Price</span>
              <span className="font-medium">
                {formatCurrency(order.unit_price_cents)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Total</span>
              <span className="font-bold">
                {formatCurrency(order.total_price_cents)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pdfUrl && (
              <Button asChild className="w-full">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Sticker PDF
                </a>
              </Button>
            )}
            {order.tracking_number && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tracking:</span>
                <a
                  href={`https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${order.tracking_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  {order.tracking_number}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Update Section */}
      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderStatusUpdater
            orderId={order.id}
            currentStatus={order.status}
            trackingNumber={order.tracking_number}
          />
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline order={order} />
        </CardContent>
      </Card>
    </div>
  );
}
