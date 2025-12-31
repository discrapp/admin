'use client';

import { Check, Clock, CreditCard, Printer, Truck, Package } from 'lucide-react';

interface Order {
  status: string;
  created_at: string;
  printed_at: string | null;
  shipped_at: string | null;
  tracking_number: string | null;
}

interface OrderTimelineProps {
  order: Order;
}

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface TimelineItem {
  status: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  date: string | null;
  completed: boolean;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const statusOrder = ['paid', 'processing', 'printed', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(order.status);

  const timelineItems: TimelineItem[] = [
    {
      status: 'paid',
      label: 'Payment Received',
      icon: CreditCard,
      date: order.created_at,
      completed: currentIndex >= 0,
    },
    {
      status: 'processing',
      label: 'Processing Started',
      icon: Clock,
      date: currentIndex >= 1 ? order.created_at : null, // We don't track processing start time separately
      completed: currentIndex >= 1,
    },
    {
      status: 'printed',
      label: 'Printed',
      icon: Printer,
      date: order.printed_at,
      completed: currentIndex >= 2,
    },
    {
      status: 'shipped',
      label: 'Shipped',
      icon: Truck,
      date: order.shipped_at,
      completed: currentIndex >= 3,
    },
    {
      status: 'delivered',
      label: 'Delivered',
      icon: Package,
      date: null, // We don't track delivery time
      completed: currentIndex >= 4,
    },
  ];

  // Handle cancelled status
  if (order.status === 'cancelled') {
    return (
      <div className="text-red-600 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        Order was cancelled
      </div>
    );
  }

  // Handle pending payment
  if (order.status === 'pending_payment') {
    return (
      <div className="text-yellow-600 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        Awaiting payment
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timelineItems.map((item, index) => (
        <div key={item.status} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                item.completed
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
              }`}
            >
              {item.completed ? (
                <Check className="h-4 w-4" />
              ) : (
                <item.icon className="h-4 w-4" />
              )}
            </div>
            {index < timelineItems.length - 1 && (
              <div
                className={`w-0.5 h-8 ${
                  item.completed && timelineItems[index + 1]?.completed
                    ? 'bg-green-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
          <div className="pb-4">
            <div
              className={`font-medium ${
                item.completed ? '' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </div>
            {item.date && (
              <div className="text-sm text-muted-foreground">
                {formatDate(item.date)}
              </div>
            )}
            {item.status === 'shipped' && order.tracking_number && (
              <div className="text-sm text-blue-600">
                Tracking: {order.tracking_number}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
