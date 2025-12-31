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
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useCallback, useState } from 'react';

interface CatalogFiltersProps {
  manufacturers: string[];
  categories: string[];
  currentSearch?: string;
  currentStatus?: string;
  currentCategory?: string;
  currentManufacturer?: string;
}

export function CatalogFilters({
  manufacturers,
  categories,
  currentSearch,
  currentStatus,
  currentCategory,
  currentManufacturer,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch || '');

  const updateFilters = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/catalog?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateFilters('search', search || null);
  };

  const clearFilters = () => {
    setSearch('');
    router.push('/catalog');
  };

  const hasFilters =
    currentSearch || currentStatus || currentCategory || currentManufacturer;

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex gap-2 flex-1 min-w-[200px]">
        <Input
          placeholder="Search manufacturer or mold..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="secondary" size="icon" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Select
        value={currentStatus || 'all'}
        onValueChange={(value) => updateFilters('status', value)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="user_submitted">Pending</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={currentCategory || 'all'}
        onValueChange={(value) => updateFilters('category', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentManufacturer || 'all'}
        onValueChange={(value) => updateFilters('manufacturer', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Manufacturer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Manufacturers</SelectItem>
          {manufacturers.map((manufacturer) => (
            <SelectItem key={manufacturer} value={manufacturer}>
              {manufacturer}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
