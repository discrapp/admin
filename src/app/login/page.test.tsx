import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders login form with email and password fields', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders Discr logo', () => {
      render(<LoginPage />);

      const logos = screen.getAllByAltText('Discr');
      expect(logos.length).toBeGreaterThan(0);
    });

    it('renders description text', () => {
      render(<LoginPage />);

      expect(screen.getByText(/sign in to access the admin dashboard/i)).toBeInTheDocument();
    });
  });

  describe('form interaction', () => {
    it('updates email field on input', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });

      expect(emailInput).toHaveValue('admin@test.com');
    });

    it('updates password field on input', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('successful login', () => {
    it('redirects admin user to home page on successful login', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            app_metadata: { role: 'admin' },
          },
        },
        error: null,
      });

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'admin@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('redirects printer user to home page on successful login', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'printer-123',
            app_metadata: { role: 'printer' },
          },
        },
        error: null,
      });

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'printer@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('shows loading state while signing in', async () => {
      let resolveSignIn: (value: unknown) => void;
      mockSignInWithPassword.mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
      );

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'admin@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Button should show loading text
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();

      // Resolve the promise
      resolveSignIn!({
        data: { user: { id: '123', app_metadata: { role: 'admin' } } },
        error: null,
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });
  });

  describe('login errors', () => {
    it('displays error message from Supabase auth', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'wrong@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
      });
    });

    it('signs out and shows error for users without admin/printer role', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            app_metadata: { role: 'viewer' },
          },
        },
        error: null,
      });
      mockSignOut.mockResolvedValue({ error: null });

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'viewer@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(
          screen.getByText('You do not have permission to access the admin dashboard.')
        ).toBeInTheDocument();
      });
    });

    it('signs out and shows error for users without any role', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            app_metadata: {},
          },
        },
        error: null,
      });
      mockSignOut.mockResolvedValue({ error: null });

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'user@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(
          screen.getByText('You do not have permission to access the admin dashboard.')
        ).toBeInTheDocument();
      });
    });

    it('displays generic error for unexpected exceptions', async () => {
      mockSignInWithPassword.mockRejectedValue(new Error('Network error'));

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'admin@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });
  });
});
