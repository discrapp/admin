'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface RecoveryFiltersProps {
  currentStatus?: string;
}

export function RecoveryFilters({ currentStatus }: RecoveryFiltersProps) {
  const router = useRouter();

  const updateStatus = (value: string) => {
    if (value === 'all') {
      router.push('/recoveries');
    } else {
      router.push(`/recoveries?status=${value}`);
    }
  };

  const clearFilters = () => {
    router.push('/recoveries');
  };

  return (
    <div className="flex gap-4 items-center">
      <Select
        value={currentStatus || 'all'}
        onValueChange={updateStatus}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="found">Found</SelectItem>
          <SelectItem value="meetup_proposed">Meetup Proposed</SelectItem>
          <SelectItem value="meetup_confirmed">Meetup Confirmed</SelectItem>
          <SelectItem value="recovered">Recovered</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {currentStatus && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
