'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PlasticFiltersProps {
  manufacturers: string[];
  currentSearch?: string;
  currentStatus?: string;
  currentManufacturer?: string;
}

export function PlasticFilters({
  manufacturers,
  currentSearch,
  currentStatus,
  currentManufacturer,
}: PlasticFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filtering
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters = currentSearch || currentStatus || currentManufacturer;

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search plastics..."
          defaultValue={currentSearch}
          onChange={(e) => {
            const value = e.target.value;
            // Debounce the search
            const timeoutId = setTimeout(() => {
              updateParams('search', value || null);
            }, 300);
            return () => clearTimeout(timeoutId);
          }}
        />
      </div>

      <Select
        value={currentStatus || 'all'}
        onValueChange={(value) =>
          updateParams('status', value === 'all' ? null : value)
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="official">Official</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={currentManufacturer || 'all'}
        onValueChange={(value) =>
          updateParams('manufacturer', value === 'all' ? null : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Manufacturer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Manufacturers</SelectItem>
          {manufacturers.map((mfr) => (
            <SelectItem key={mfr} value={mfr}>
              {mfr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" onClick={clearFilters} className="gap-2">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
