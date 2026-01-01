import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Brain, Target, Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

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
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatConfidence(confidence: number | null) {
  if (confidence === null) return '—';
  return `${Math.round(confidence * 100)}%`;
}

export default async function AIInsightsPage() {
  // Server-side authorization check - admin only
  await requireAdmin();

  const supabase = await createClient();

  // Fetch AI identification metrics
  const { data: identificationLogs } = await supabase
    .from('ai_identification_logs')
    .select('id, ai_confidence, was_corrected, processing_time_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  // Fetch shot recommendation metrics
  const { data: shotLogs } = await supabase
    .from('shot_recommendation_logs')
    .select('id, ai_confidence, processing_time_ms, recommended_throw_type, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  // Fetch recent identification logs with details
  const { data: recentIdentifications } = await supabase
    .from('ai_identification_logs')
    .select(`
      id,
      ai_manufacturer,
      ai_mold,
      ai_confidence,
      was_corrected,
      user_manufacturer,
      user_mold,
      processing_time_ms,
      model_version,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch recent shot recommendations with details
  const { data: recentShots } = await supabase
    .from('shot_recommendation_logs')
    .select(`
      id,
      ai_estimated_distance_ft,
      ai_confidence,
      recommended_throw_type,
      recommended_power_percentage,
      processing_time_ms,
      model_version,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Calculate identification metrics
  const totalIdentifications = identificationLogs?.length || 0;
  const avgIdentificationConfidence = identificationLogs?.length
    ? identificationLogs.reduce((sum, log) => sum + (log.ai_confidence || 0), 0) / identificationLogs.length
    : 0;
  const correctedCount = identificationLogs?.filter((log) => log.was_corrected).length || 0;
  const correctionRate = totalIdentifications > 0 ? correctedCount / totalIdentifications : 0;
  const avgIdentificationTime = identificationLogs?.length
    ? identificationLogs.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / identificationLogs.length
    : 0;

  // Calculate shot recommendation metrics
  const totalShotRecs = shotLogs?.length || 0;
  const avgShotConfidence = shotLogs?.length
    ? shotLogs.reduce((sum, log) => sum + (log.ai_confidence || 0), 0) / shotLogs.length
    : 0;
  const avgShotTime = shotLogs?.length
    ? shotLogs.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / shotLogs.length
    : 0;

  // Throw type distribution
  const throwTypes = shotLogs?.reduce(
    (acc, log) => {
      if (log.recommended_throw_type) {
        acc[log.recommended_throw_type] = (acc[log.recommended_throw_type] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Insights</h1>
        <p className="text-muted-foreground">
          Monitor AI model performance and accuracy
        </p>
      </div>

      {/* Identification Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Disc Identification</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Identifications
              </CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalIdentifications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Confidence
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatConfidence(avgIdentificationConfidence)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Correction Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatConfidence(correctionRate)}
              </div>
              <p className="text-xs text-muted-foreground">
                {correctedCount} corrected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Processing Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgIdentificationTime > 0 ? `${Math.round(avgIdentificationTime)}ms` : '—'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shot Recommendation Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Shot Recommendations</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Recommendations
              </CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalShotRecs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Confidence
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatConfidence(avgShotConfidence)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Throw Types
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(throwTypes).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}: {count}
                  </Badge>
                ))}
                {Object.keys(throwTypes).length === 0 && (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Processing Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgShotTime > 0 ? `${Math.round(avgShotTime)}ms` : '—'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Logs */}
      <Tabs defaultValue="identifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="identifications">
            Identification Logs ({recentIdentifications?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="shots">
            Shot Recommendations ({recentShots?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identifications">
          <Card>
            <CardHeader>
              <CardTitle>Recent Disc Identifications</CardTitle>
            </CardHeader>
            <CardContent>
              {recentIdentifications && recentIdentifications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>AI Result</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Corrected</TableHead>
                      <TableHead>User Correction</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentIdentifications.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.ai_manufacturer} {log.ai_mold}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              (log.ai_confidence || 0) >= 0.8
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : (log.ai_confidence || 0) >= 0.5
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }
                          >
                            {formatConfidence(log.ai_confidence)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.was_corrected ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          {log.was_corrected
                            ? `${log.user_manufacturer} ${log.user_mold}`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {log.processing_time_ms
                            ? `${log.processing_time_ms}ms`
                            : '—'}
                        </TableCell>
                        <TableCell>{formatDateTime(log.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No identification logs yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shots">
          <Card>
            <CardHeader>
              <CardTitle>Recent Shot Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {recentShots && recentShots.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distance</TableHead>
                      <TableHead>Throw Type</TableHead>
                      <TableHead>Power</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentShots.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.ai_estimated_distance_ft
                            ? `${log.ai_estimated_distance_ft} ft`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.recommended_throw_type || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.recommended_power_percentage
                            ? `${log.recommended_power_percentage}%`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              (log.ai_confidence || 0) >= 0.8
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : (log.ai_confidence || 0) >= 0.5
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }
                          >
                            {formatConfidence(log.ai_confidence)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.processing_time_ms
                            ? `${log.processing_time_ms}ms`
                            : '—'}
                        </TableCell>
                        <TableCell>{formatDateTime(log.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No shot recommendation logs yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
