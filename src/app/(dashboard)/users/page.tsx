import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { UsersTable } from './users-table';
import { UserFilters } from './user-filters';

export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  page?: string;
  sort?: string;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Server-side authorization check - admin only
  await requireAdmin();

  const params = await searchParams;
  const supabase = await createClient();

  const search = params.search || '';
  const page = parseInt(params.page || '1', 10);
  const sort = params.sort || 'newest';
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Build query
  let query = supabase
    .from('profiles')
    .select(
      `
      id,
      email,
      full_name,
      username,
      avatar_url,
      created_at,
      stripe_customer_id,
      stripe_connect_account_id,
      push_token
    `,
      { count: 'exact' }
    )
    .range(offset, offset + pageSize - 1);

  // Apply sort
  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else if (sort === 'name') {
    query = query.order('full_name', { ascending: true, nullsFirst: false });
  }

  // Apply search filter
  if (search) {
    query = query.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%,username.ilike.%${search}%`
    );
  }

  const { data: users, count, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
  }

  // Get disc counts for each user
  const userIds = users?.map((u) => u.id) || [];
  const { data: discCounts } = await supabase
    .from('discs')
    .select('owner_id')
    .in('owner_id', userIds);

  // Count discs per user
  const discCountMap: Record<string, number> = {};
  discCounts?.forEach((disc) => {
    discCountMap[disc.owner_id] = (discCountMap[disc.owner_id] || 0) + 1;
  });

  // Get order counts for each user
  const { data: orderCounts } = await supabase
    .from('sticker_orders')
    .select('user_id')
    .in('user_id', userIds);

  // Count orders per user
  const orderCountMap: Record<string, number> = {};
  orderCounts?.forEach((order) => {
    orderCountMap[order.user_id] = (orderCountMap[order.user_id] || 0) + 1;
  });

  const totalPages = Math.ceil((count || 0) / pageSize);

  // Enrich users with counts
  const enrichedUsers =
    users?.map((user) => ({
      ...user,
      disc_count: discCountMap[user.id] || 0,
      order_count: orderCountMap[user.id] || 0,
    })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage user accounts and view user activity
        </p>
      </div>

      <UserFilters currentSearch={search} currentSort={sort} />

      <UsersTable
        users={enrichedUsers}
        currentPage={page}
        totalPages={totalPages}
        totalCount={count || 0}
      />
    </div>
  );
}
