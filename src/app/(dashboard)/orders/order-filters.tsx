'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCallback, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'printed', label: 'Printed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface OrderFiltersProps {
  currentStatus: string;
  currentSearch: string;
}

export function OrderFilters({
  currentStatus,
  currentSearch,
}: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // Reset to page 1 when filtering
      router.push(`/orders?${params.toString()}`);
    },
    [router, searchParams]
  );

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateParams('search', value);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleStatusChange = (value: string) => {
    updateParams('status', value);
  };

  return (
    <div
      className="flex flex-col sm:flex-row gap-4"
      role="search"
      aria-label="Filter orders"
    >
      <div className="flex-1">
        <label htmlFor="order-search" className="sr-only">
          Search orders
        </label>
        <Input
          id="order-search"
          placeholder="Search by order number..."
          value={searchValue}
          onChange={handleSearchChange}
          className="max-w-sm"
          aria-describedby="search-hint"
        />
        <span id="search-hint" className="sr-only">
          Type to search orders by order number
        </span>
      </div>
      <div>
        <label htmlFor="status-filter" className="sr-only">
          Filter by status
        </label>
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]" id="status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
