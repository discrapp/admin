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
import { Lightbulb, Target, Clock, Users, Hash } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Profile {
  email: string | null;
  full_name: string | null;
  username: string | null;
}

interface RecommendationLog {
  id: string;
  user_id: string;
  request_count: number;
  bag_analysis: {
    total_discs: number;
    identified_gaps: string[];
  } | null;
  recommendations: Array<{
    disc: {
      manufacturer: string;
      mold: string;
    };
    gap_type: string;
    priority: number;
  }> | null;
  confidence: number | null;
  processing_time_ms: number | null;
  model_version: string | null;
  created_at: string;
  profiles: Profile | null;
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatConfidence(confidence: number | null) {
  if (confidence === null) return '—';
  return `${Math.round(confidence * 100)}%`;
}

function formatProcessingTime(ms: number | null) {
  if (!ms) return '—';
  return ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function getTopRecommendation(
  recommendations: RecommendationLog['recommendations']
): string {
  if (!recommendations || recommendations.length === 0) return '—';
  const top = recommendations.find((r) => r.priority === 1) || recommendations[0];
  return `${top.disc.manufacturer} ${top.disc.mold}`;
}

export default async function RecommendationsPage() {
  await requireAdmin();

  const supabase = await createClient();

  // Fetch recommendation logs with user profile
  const { data: logs } = await supabase
    .from('disc_recommendation_logs')
    .select(
      `
      id,
      user_id,
      request_count,
      bag_analysis,
      recommendations,
      confidence,
      processing_time_ms,
      model_version,
      created_at,
      profiles:user_id (email, full_name, username)
    `
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const recommendationLogs = (logs as RecommendationLog[] | null) || [];

  // Calculate metrics
  const totalRecommendations = recommendationLogs.length;
  const avgConfidence = recommendationLogs.length
    ? recommendationLogs.reduce((sum, log) => sum + (log.confidence || 0), 0) /
      recommendationLogs.length
    : 0;
  const avgProcessingTime = recommendationLogs.length
    ? recommendationLogs.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) /
      recommendationLogs.length
    : 0;

  // Count by request_count
  const requestCountDist = recommendationLogs.reduce(
    (acc, log) => {
      acc[log.request_count] = (acc[log.request_count] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  // Unique users
  const uniqueUsers = new Set(recommendationLogs.map((log) => log.user_id)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Disc Recommendations</h1>
        <p className="text-muted-foreground">
          Monitor AI-powered bag gap analysis and disc recommendations
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecommendations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatConfidence(avgConfidence)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatProcessingTime(avgProcessingTime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Request Counts</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {[1, 3, 5].map((count) => (
                <Badge key={count} variant="secondary" className="text-xs">
                  {count}: {requestCountDist[count] || 0}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Recommendation Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {recommendationLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Top Recommendation</TableHead>
                  <TableHead>Bag Size</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendationLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.profiles?.email || log.profiles?.username || log.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.request_count}</Badge>
                    </TableCell>
                    <TableCell>{getTopRecommendation(log.recommendations)}</TableCell>
                    <TableCell>
                      {log.bag_analysis?.total_discs ?? '—'} discs
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          (log.confidence || 0) >= 0.8
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : (log.confidence || 0) >= 0.5
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }
                      >
                        {formatConfidence(log.confidence)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatProcessingTime(log.processing_time_ms)}</TableCell>
                    <TableCell>{formatDateTime(log.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No recommendation requests yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
