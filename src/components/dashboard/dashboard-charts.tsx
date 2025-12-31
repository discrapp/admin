'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart } from '@/components/charts/area-chart';

interface ChartData {
  date: string;
  value: number;
}

interface DashboardChartsProps {
  signupsData: ChartData[];
  ordersData: ChartData[];
  recoveriesData: ChartData[];
}

export function DashboardCharts({
  signupsData,
  ordersData,
  recoveriesData,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Signups</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart data={signupsData} color="hsl(var(--chart-1))" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart data={ordersData} color="hsl(var(--chart-2))" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recoveries</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart data={recoveriesData} color="hsl(var(--chart-3))" />
        </CardContent>
      </Card>
    </div>
  );
}
