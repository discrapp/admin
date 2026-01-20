'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle, XCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface PlasticActionsProps {
  plasticId: string;
  currentStatus: string;
}

export function PlasticActions({
  plasticId,
  currentStatus,
}: PlasticActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const approvePlastic = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.functions.invoke('approve-plastic-type', {
        body: { plastic_id: plasticId, action: 'approve' },
      });

      if (error) throw error;

      toast.success('Plastic type approved!');
      router.refresh();
    } catch (error) {
      console.error('Error approving plastic:', error);
      toast.error('Failed to approve plastic type');
    } finally {
      setLoading(false);
    }
  };

  const rejectPlastic = async () => {
    if (
      !confirm(
        'Are you sure you want to reject this plastic type? This cannot be undone.'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.functions.invoke('approve-plastic-type', {
        body: { plastic_id: plasticId, action: 'reject' },
      });

      if (error) throw error;

      toast.success('Plastic type rejected');
      router.refresh();
    } catch (error) {
      console.error('Error rejecting plastic:', error);
      toast.error('Failed to reject plastic type');
    } finally {
      setLoading(false);
    }
  };

  const deletePlastic = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this plastic type? This cannot be undone.'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('plastic_types')
        .delete()
        .eq('id', plasticId);

      if (error) throw error;

      toast.success('Plastic type deleted');
      router.refresh();
    } catch (error) {
      console.error('Error deleting plastic:', error);
      toast.error('Failed to delete plastic type');
    } finally {
      setLoading(false);
    }
  };

  // For official/approved plastics, only show delete option
  if (currentStatus !== 'pending') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={deletePlastic}
            className="text-red-600 dark:text-red-400"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // For pending plastics, show approve/reject options
  return (
    <div className="flex items-center gap-2 justify-end">
      <Button
        variant="ghost"
        size="sm"
        onClick={approvePlastic}
        disabled={loading}
        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve
          </>
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={rejectPlastic}
        disabled={loading}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        <XCircle className="h-4 w-4 mr-1" />
        Reject
      </Button>
    </div>
  );
}
