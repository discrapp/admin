'use client';

import { ErrorDisplay } from '@/components/error-display';

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay error={error} reset={reset} title="Failed to load orders" />
  );
}
