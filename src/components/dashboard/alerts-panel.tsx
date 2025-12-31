'use client';

import { AlertTriangle, Clock, CreditCard, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Alert {
  id: string;
  type: 'stuck_order' | 'failed_payment' | 'error';
  title: string;
  description: string;
  link?: string;
  timestamp: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const alertIcons = {
  stuck_order: Clock,
  failed_payment: CreditCard,
  error: XCircle,
};

const alertColors = {
  stuck_order: 'bg-yellow-500/10 text-yellow-500',
  failed_payment: 'bg-red-500/10 text-red-500',
  error: 'bg-red-500/10 text-red-500',
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No alerts at this time. Everything looks good!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Alerts
          <Badge variant="destructive" className="ml-2">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alertIcons[alert.type];
            const colorClass = alertColors[alert.type];
            const content = (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className={`p-2 rounded-full ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {alert.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.timestamp}
                  </p>
                </div>
              </div>
            );

            if (alert.link) {
              return (
                <Link key={alert.id} href={alert.link}>
                  {content}
                </Link>
              );
            }

            return content;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
