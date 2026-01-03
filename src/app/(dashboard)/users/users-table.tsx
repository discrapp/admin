'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Eye, Disc, Package, Phone } from 'lucide-react';
import { ExportButtons } from '@/components/export-buttons';
import { exportToCSV, exportToPDF, formatters } from '@/lib/export';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  stripe_customer_id: string | null;
  stripe_connect_account_id: string | null;
  push_token: string | null;
  phone_number: string | null;
  phone_discoverable: boolean;
  disc_count: number;
  order_count: number;
}

interface UsersTableProps {
  users: User[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

export function UsersTable({
  users,
  currentPage,
  totalPages,
  totalCount,
}: UsersTableProps) {
  const router = useRouter();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    router.push(`/users?${params.toString()}`);
  };

  const exportColumns = [
    { key: 'email', header: 'Email' },
    { key: 'full_name', header: 'Name' },
    { key: 'username', header: 'Username' },
    { key: 'disc_count', header: 'Discs', format: formatters.number },
    { key: 'order_count', header: 'Orders', format: formatters.number },
    {
      key: 'stripe_connect_account_id',
      header: 'Stripe Connect',
      format: formatters.boolean,
    },
    { key: 'push_token', header: 'Push Enabled', format: formatters.boolean },
    { key: 'created_at', header: 'Joined', format: formatters.date },
  ];

  const handleExportCSV = () => {
    exportToCSV(users, exportColumns, `users-${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    exportToPDF(users, exportColumns, 'Users Report');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportButtons
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          disabled={users.length === 0}
        />
      </div>
      <div className="rounded-md border">
        <Table aria-label="Users list">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">User</TableHead>
              <TableHead scope="col">Username</TableHead>
              <TableHead scope="col">Discs</TableHead>
              <TableHead scope="col">Orders</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col">Joined</TableHead>
              <TableHead scope="col" className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.full_name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.username ? (
                      <span className="text-muted-foreground">
                        @{user.username}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Disc className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      <span aria-label={`${user.disc_count} discs`}>
                        {user.disc_count}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      <span aria-label={`${user.order_count} orders`}>
                        {user.order_count}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.phone_discoverable && (
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-800
                            dark:bg-purple-900 dark:text-purple-200"
                        >
                          <Phone className="h-3 w-3 mr-1" aria-hidden="true" />
                          Discoverable
                        </Badge>
                      )}
                      {user.stripe_connect_account_id && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800
                            dark:bg-green-900 dark:text-green-200"
                        >
                          Stripe Connect
                        </Badge>
                      )}
                      {user.push_token && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800
                            dark:bg-blue-900 dark:text-blue-200"
                        >
                          Push Enabled
                        </Badge>
                      )}
                      {!user.stripe_connect_account_id &&
                        !user.push_token &&
                        !user.phone_discoverable && (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/users/${user.id}`}
                        aria-label={`View user ${user.full_name || user.email}`}
                      >
                        <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <nav aria-label="Users pagination" className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing {users.length} of {totalCount} users
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </Button>
          <span className="text-sm" aria-current="page">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Go to next page"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </nav>
    </div>
  );
}
