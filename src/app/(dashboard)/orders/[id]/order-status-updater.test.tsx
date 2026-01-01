import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderStatusUpdater } from './order-status-updater';

// Mock Supabase client
const mockUpdate = vi.fn();
const mockEq = vi.fn(() => Promise.resolve({ error: null }));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      update: vi.fn((data) => {
        mockUpdate(data);
        return { eq: mockEq };
      }),
    })),
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('OrderStatusUpdater', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
  });

  describe('rendering', () => {
    it('shows "Start Processing" button when status is paid', () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="paid"
          trackingNumber={null}
        />
      );

      expect(screen.getByText('Start Processing')).toBeInTheDocument();
    });

    it('shows "Mark as Printed" button when status is processing', () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="processing"
          trackingNumber={null}
        />
      );

      expect(screen.getByText('Mark as Printed')).toBeInTheDocument();
    });

    it('shows tracking input and "Mark as Shipped" button when status is printed', () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="printed"
          trackingNumber={null}
        />
      );

      expect(screen.getByPlaceholderText('Tracking number (optional)')).toBeInTheDocument();
      expect(screen.getByText('Mark as Shipped')).toBeInTheDocument();
    });

    it('shows "Mark as Delivered" button when status is shipped with tracking', () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="shipped"
          trackingNumber="TRACK123"
        />
      );

      expect(screen.getByText('Mark as Delivered')).toBeInTheDocument();
    });

    it('shows message about no tracking when shipped without tracking number', () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="shipped"
          trackingNumber={null}
        />
      );

      expect(
        screen.getByText('Shipped without tracking. Delivery status cannot be tracked.')
      ).toBeInTheDocument();
      expect(screen.queryByText('Mark as Delivered')).not.toBeInTheDocument();
    });

    it('shows delivered message when status is delivered', () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="delivered"
          trackingNumber="TRACK123"
        />
      );

      expect(screen.getByText('This order has been delivered.')).toBeInTheDocument();
    });

    it('shows cancelled message when status is cancelled', () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="cancelled"
          trackingNumber={null}
        />
      );

      expect(screen.getByText('This order has been cancelled.')).toBeInTheDocument();
    });

    it('shows pending payment message when status is pending_payment', () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="pending_payment"
          trackingNumber={null}
        />
      );

      expect(screen.getByText('Waiting for payment to be completed.')).toBeInTheDocument();
    });

    it('displays status progress indicator', () => {
      const { container } = render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="processing"
          trackingNumber={null}
        />
      );

      // Should have 5 status dots (paid, processing, printed, shipped, delivered)
      const dots = container.querySelectorAll('.rounded-full');
      expect(dots.length).toBe(5);
    });
  });

  describe('status updates', () => {
    it('updates status to processing when "Start Processing" is clicked', async () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="paid"
          trackingNumber={null}
        />
      );

      fireEvent.click(screen.getByText('Start Processing'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'processing' })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Order status updated to processing');
    });

    it('updates status to printed with timestamp when "Mark as Printed" is clicked', async () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="processing"
          trackingNumber={null}
        />
      );

      fireEvent.click(screen.getByText('Mark as Printed'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'printed',
            printed_at: expect.any(String),
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Order status updated to printed');
    });

    it('updates status to shipped with tracking number and timestamp', async () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="printed"
          trackingNumber={null}
        />
      );

      const input = screen.getByPlaceholderText('Tracking number (optional)');
      fireEvent.change(input, { target: { value: 'TRACK12345' } });
      fireEvent.click(screen.getByText('Mark as Shipped'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'shipped',
            tracking_number: 'TRACK12345',
            shipped_at: expect.any(String),
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Order status updated to shipped');
    });

    it('updates status to shipped without tracking number', async () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="printed"
          trackingNumber={null}
        />
      );

      fireEvent.click(screen.getByText('Mark as Shipped'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'shipped',
            shipped_at: expect.any(String),
          })
        );
        // Should not include tracking_number when empty
        expect(mockUpdate).not.toHaveBeenCalledWith(
          expect.objectContaining({ tracking_number: '' })
        );
      });
    });

    it('updates status to delivered when "Mark as Delivered" is clicked', async () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="shipped"
          trackingNumber="TRACK123"
        />
      );

      fireEvent.click(screen.getByText('Mark as Delivered'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'delivered' })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('Order status updated to delivered');
    });
  });

  describe('error handling', () => {
    it('shows error toast when update fails', async () => {
      mockEq.mockResolvedValue({ error: new Error('Database error') });

      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="paid"
          trackingNumber={null}
        />
      );

      fireEvent.click(screen.getByText('Start Processing'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update order status');
      });
    });
  });

  describe('local state updates', () => {
    it('updates local status after successful API call', async () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="paid"
          trackingNumber={null}
        />
      );

      // Initially shows "Start Processing"
      expect(screen.getByText('Start Processing')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Start Processing'));

      // After successful update, should show "Mark as Printed"
      await waitFor(() => {
        expect(screen.getByText('Mark as Printed')).toBeInTheDocument();
      });
    });

    it('preserves tracking number in local state after shipping', async () => {
      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="printed"
          trackingNumber={null}
        />
      );

      const input = screen.getByPlaceholderText('Tracking number (optional)');
      fireEvent.change(input, { target: { value: 'MYTRACK123' } });
      fireEvent.click(screen.getByText('Mark as Shipped'));

      // After shipping, should show "Mark as Delivered" because we have tracking
      await waitFor(() => {
        expect(screen.getByText('Mark as Delivered')).toBeInTheDocument();
      });
    });
  });

  describe('button disabled states', () => {
    it('disables buttons while loading', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: { error: null }) => void;
      const pendingPromise = new Promise<{ error: null }>((resolve) => {
        resolvePromise = resolve;
      });
      mockEq.mockReturnValue(pendingPromise);

      render(
        <OrderStatusUpdater
          orderId="order-123"
          currentStatus="paid"
          trackingNumber={null}
        />
      );

      const button = screen.getByText('Start Processing');
      fireEvent.click(button);

      // Button should be disabled while loading
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeDisabled();
      });

      // Resolve the promise
      resolvePromise!({ error: null });

      // Button should be enabled after loading
      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });
  });
});
