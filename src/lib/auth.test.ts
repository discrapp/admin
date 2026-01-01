import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock redirect - must be before importing auth
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

// Mock Supabase server client
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

import {
  getAuthenticatedUser,
  requireAdmin,
  requireAdminOrPrinter,
} from './auth';

describe('auth utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthenticatedUser', () => {
    it('returns null when no user is authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });

    it('returns null when user has no role', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: {},
          },
        },
        error: null,
      });

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });

    it('returns null when user has invalid role', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { role: 'invalid' },
          },
        },
        error: null,
      });

      const result = await getAuthenticatedUser();

      expect(result).toBeNull();
    });

    it('returns auth result for admin user', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            app_metadata: { role: 'admin' },
          },
        },
        error: null,
      });

      const result = await getAuthenticatedUser();

      expect(result).toEqual({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
        },
        role: 'admin',
      });
    });

    it('returns auth result for printer user', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'printer-123',
            email: 'printer@example.com',
            app_metadata: { role: 'printer' },
          },
        },
        error: null,
      });

      const result = await getAuthenticatedUser();

      expect(result).toEqual({
        user: {
          id: 'printer-123',
          email: 'printer@example.com',
        },
        role: 'printer',
      });
    });
  });

  describe('requireAdmin', () => {
    it('redirects to /unauthorized when no user is authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(requireAdmin()).rejects.toThrow('NEXT_REDIRECT:/unauthorized');
      expect(mockRedirect).toHaveBeenCalledWith('/unauthorized');
    });

    it('redirects to /unauthorized when user has no valid role', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: {},
          },
        },
        error: null,
      });

      await expect(requireAdmin()).rejects.toThrow('NEXT_REDIRECT:/unauthorized');
      expect(mockRedirect).toHaveBeenCalledWith('/unauthorized');
    });

    it('redirects to /orders when user is a printer', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'printer-123',
            email: 'printer@example.com',
            app_metadata: { role: 'printer' },
          },
        },
        error: null,
      });

      await expect(requireAdmin()).rejects.toThrow('NEXT_REDIRECT:/orders');
      expect(mockRedirect).toHaveBeenCalledWith('/orders');
    });

    it('returns auth result for admin user', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            app_metadata: { role: 'admin' },
          },
        },
        error: null,
      });

      const result = await requireAdmin();

      expect(result).toEqual({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
        },
        role: 'admin',
      });
    });
  });

  describe('requireAdminOrPrinter', () => {
    it('redirects to /unauthorized when no user is authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(requireAdminOrPrinter()).rejects.toThrow(
        'NEXT_REDIRECT:/unauthorized'
      );
      expect(mockRedirect).toHaveBeenCalledWith('/unauthorized');
    });

    it('redirects to /unauthorized when user has no valid role', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { role: 'invalid' },
          },
        },
        error: null,
      });

      await expect(requireAdminOrPrinter()).rejects.toThrow(
        'NEXT_REDIRECT:/unauthorized'
      );
      expect(mockRedirect).toHaveBeenCalledWith('/unauthorized');
    });

    it('returns auth result for admin user', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            app_metadata: { role: 'admin' },
          },
        },
        error: null,
      });

      const result = await requireAdminOrPrinter();

      expect(result).toEqual({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
        },
        role: 'admin',
      });
    });

    it('returns auth result for printer user', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'printer-123',
            email: 'printer@example.com',
            app_metadata: { role: 'printer' },
          },
        },
        error: null,
      });

      const result = await requireAdminOrPrinter();

      expect(result).toEqual({
        user: {
          id: 'printer-123',
          email: 'printer@example.com',
        },
        role: 'printer',
      });
    });
  });
});
