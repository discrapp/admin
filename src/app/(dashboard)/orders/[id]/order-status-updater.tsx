'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Play, Printer, Truck, CheckCircle } from 'lucide-react';

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  trackingNumber: string | null;
}

const statusFlow = ['paid', 'processing', 'printed', 'shipped', 'delivered'];

export function OrderStatusUpdater({
  orderId,
  currentStatus,
  trackingNumber: initialTrackingNumber,
}: OrderStatusUpdaterProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || '');

  const currentIndex = statusFlow.indexOf(currentStatus);

  const updateStatus = async (newStatus: string, additionalData?: Record<string, unknown>) => {
    setLoading(newStatus);
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        ...additionalData,
      };

      // Add timestamps for specific statuses
      if (newStatus === 'printed') {
        updateData.printed_at = new Date().toISOString();
      } else if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('sticker_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Order status updated to ${newStatus}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status');
    } finally {
      setLoading(null);
    }
  };

  const handleMarkProcessing = () => updateStatus('processing');
  const handleMarkPrinted = () => updateStatus('printed');
  const handleMarkShipped = () => {
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }
    updateStatus('shipped', { tracking_number: trackingNumber.trim() });
  };
  const handleMarkDelivered = () => updateStatus('delivered');

  // Can't update if cancelled or pending payment
  if (currentStatus === 'cancelled' || currentStatus === 'pending_payment') {
    return (
      <p className="text-sm text-muted-foreground">
        {currentStatus === 'cancelled'
          ? 'This order has been cancelled.'
          : 'Waiting for payment to be completed.'}
      </p>
    );
  }

  // Already delivered
  if (currentStatus === 'delivered') {
    return (
      <p className="text-sm text-green-600 flex items-center gap-2">
        <CheckCircle className="h-4 w-4" />
        This order has been delivered.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {currentStatus === 'paid' && (
          <Button onClick={handleMarkProcessing} disabled={!!loading}>
            {loading === 'processing' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start Processing
          </Button>
        )}

        {currentStatus === 'processing' && (
          <Button onClick={handleMarkPrinted} disabled={!!loading}>
            {loading === 'printed' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            Mark as Printed
          </Button>
        )}

        {currentStatus === 'printed' && (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Input
              placeholder="Enter tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleMarkShipped} disabled={!!loading}>
              {loading === 'shipped' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Truck className="h-4 w-4 mr-2" />
              )}
              Mark as Shipped
            </Button>
          </div>
        )}

        {currentStatus === 'shipped' && (
          <Button onClick={handleMarkDelivered} disabled={!!loading}>
            {loading === 'delivered' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Mark as Delivered
          </Button>
        )}
      </div>

      {/* Status progress indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {statusFlow.map((status, index) => (
          <div key={status} className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full ${
                index <= currentIndex ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            {index < statusFlow.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
