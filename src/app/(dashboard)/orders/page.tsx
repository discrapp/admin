import { createClient } from '@/lib/supabase/server';
import { requireAdminOrPrinter } from '@/lib/auth';
import { OrdersTable } from './orders-table';
import { OrderFilters } from './order-filters';

export const dynamic = 'force-dynamic';

interface SearchParams {
  status?: string;
  search?: string;
  page?: string;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Server-side authorization check - admin or printer
  await requireAdminOrPrinter();

  const params = await searchParams;
  const supabase = await createClient();

  const status = params.status || 'all';
  const search = params.search || '';
  const page = parseInt(params.page || '1', 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Build query
  let query = supabase
    .from('sticker_orders')
    .select(
      `
      *,
      profiles:user_id (
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
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Apply status filter
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  // Apply search filter
  if (search) {
    query = query.or(`order_number.ilike.%${search}%`);
  }

  const { data: orders, count, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
  }

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">
          Manage sticker orders and fulfillment
        </p>
      </div>

      <OrderFilters currentStatus={status} currentSearch={search} />

      <OrdersTable
        orders={orders || []}
        currentPage={page}
        totalPages={totalPages}
        totalCount={count || 0}
      />
    </div>
  );
}
