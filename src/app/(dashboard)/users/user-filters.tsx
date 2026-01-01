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
import { Search } from 'lucide-react';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name', label: 'Name A-Z' },
];

interface UserFiltersProps {
  currentSearch: string;
  currentSort: string;
}

export function UserFilters({ currentSearch, currentSort }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'newest') {
        params.set(key, value);
      } else if (key === 'sort' && value === 'newest') {
        params.delete(key);
      } else if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // Reset to page 1 when filtering
      router.push(`/users?${params.toString()}`);
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

  const handleSortChange = (value: string) => {
    updateParams('sort', value);
  };

  return (
    <div
      className="flex flex-col sm:flex-row gap-4"
      role="search"
      aria-label="Filter and sort users"
    >
      <div className="flex-1 relative">
        <label htmlFor="user-search" className="sr-only">
          Search users
        </label>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="user-search"
          placeholder="Search by email, name, or username..."
          value={searchValue}
          onChange={handleSearchChange}
          className="max-w-sm pl-9"
          aria-describedby="user-search-hint"
        />
        <span id="user-search-hint" className="sr-only">
          Type to search users by email, name, or username
        </span>
      </div>
      <div>
        <label htmlFor="user-sort" className="sr-only">
          Sort users
        </label>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]" id="user-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
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
