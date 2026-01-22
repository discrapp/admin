import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from './middleware';

// Capture cookies config for testing
let capturedCookiesConfig: {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
} | null = null;

// Mock the Supabase SSR module
const mockGetUser = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url, _key, config) => {
    capturedCookiesConfig = config.cookies;
    return {
      auth: {
        getUser: mockGetUser,
      },
    };
  }),
}));

// Create a mock request
function createMockRequest(pathname: string, cookies: Record<string, string> = {}) {
  const url = new URL(`http://localhost:3000${pathname}`);
  const cookieStore = {
    getAll: vi.fn(() =>
      Object.entries(cookies).map(([name, value]) => ({ name, value }))
    ),
    set: vi.fn(),
  };

  return {
    nextUrl: { pathname, clone: () => url },
    url: url.toString(),
    cookies: cookieStore,
  } as unknown as NextRequest;
}

describe('updateSession middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment variables for tests
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('login page', () => {
    it('allows access to login page without authentication', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const request = createMockRequest('/login');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it('redirects authenticated users away from login page', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'admin@test.com',
            app_metadata: { role: 'admin' },
          },
        },
      });

      const request = createMockRequest('/login');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/');
    });
  });

  describe('protected routes', () => {
    it('redirects unauthenticated users to login', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const request = createMockRequest('/orders');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('allows admin users to access all routes', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@test.com',
            app_metadata: { role: 'admin' },
          },
        },
      });

      const request = createMockRequest('/users');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it('allows admin users to access orders', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@test.com',
            app_metadata: { role: 'admin' },
          },
        },
      });

      const request = createMockRequest('/orders');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });
  });

  describe('printer role restrictions', () => {
    it('allows printer role to access /orders', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'printer-123',
            email: 'printer@test.com',
            app_metadata: { role: 'printer' },
          },
        },
      });

      const request = createMockRequest('/orders');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it('allows printer role to access order detail pages', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'printer-123',
            email: 'printer@test.com',
            app_metadata: { role: 'printer' },
          },
        },
      });

      const request = createMockRequest('/orders/abc-123');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it('allows printer role to access home page', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'printer-123',
            email: 'printer@test.com',
            app_metadata: { role: 'printer' },
          },
        },
      });

      const request = createMockRequest('/');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it('redirects printer role from /users to /orders', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'printer-123',
            email: 'printer@test.com',
            app_metadata: { role: 'printer' },
          },
        },
      });

      const request = createMockRequest('/users');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/orders');
    });

    it('redirects printer role from /payments to /orders', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'printer-123',
            email: 'printer@test.com',
            app_metadata: { role: 'printer' },
          },
        },
      });

      const request = createMockRequest('/payments');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/orders');
    });

    it('redirects printer role from /system to /orders', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'printer-123',
            email: 'printer@test.com',
            app_metadata: { role: 'printer' },
          },
        },
      });

      const request = createMockRequest('/system');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/orders');
    });
  });

  describe('unauthorized page', () => {
    it('allows access to unauthorized page without authentication', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const request = createMockRequest('/unauthorized');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it('allows access to unauthorized page for users without valid role', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'regular@test.com',
            app_metadata: {},
          },
        },
      });

      const request = createMockRequest('/unauthorized');
      const response = await updateSession(request);

      // Should NOT redirect, preventing redirect loop
      expect(response.status).toBe(200);
    });

    it('allows access to unauthorized page for users with invalid role', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@test.com',
            app_metadata: { role: 'viewer' },
          },
        },
      });

      const request = createMockRequest('/unauthorized');
      const response = await updateSession(request);

      // Should NOT redirect, preventing redirect loop
      expect(response.status).toBe(200);
    });
  });

  describe('unauthorized access', () => {
    it('redirects users without role to unauthorized', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'regular@test.com',
            app_metadata: {},
          },
        },
      });

      const request = createMockRequest('/orders');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/unauthorized');
    });

    it('redirects users with invalid role to unauthorized', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@test.com',
            app_metadata: { role: 'viewer' },
          },
        },
      });

      const request = createMockRequest('/orders');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/unauthorized');
    });

    it('redirects users with null app_metadata to unauthorized', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@test.com',
            app_metadata: null,
          },
        },
      });

      const request = createMockRequest('/orders');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/unauthorized');
    });
  });

  describe('cookie handling', () => {
    it('provides getAll function that returns request cookies', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const request = createMockRequest('/login', {
        'sb-token': 'test-token',
        'sb-refresh': 'refresh-token',
      });
      await updateSession(request);

      expect(capturedCookiesConfig).toBeDefined();
      const cookies = capturedCookiesConfig!.getAll();
      expect(cookies).toHaveLength(2);
      expect(cookies).toContainEqual({ name: 'sb-token', value: 'test-token' });
      expect(cookies).toContainEqual({ name: 'sb-refresh', value: 'refresh-token' });
    });

    it('handles setAll to update cookies on request and response', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@test.com',
            app_metadata: { role: 'admin' },
          },
        },
      });

      const request = createMockRequest('/orders');
      await updateSession(request);

      // Now trigger setAll to test that code path
      expect(capturedCookiesConfig).toBeDefined();
      capturedCookiesConfig!.setAll([
        { name: 'sb-token', value: 'new-token', options: { httpOnly: true } },
        { name: 'sb-refresh', value: 'new-refresh', options: { httpOnly: true } },
      ]);

      // Verify cookies.set was called on request
      expect(request.cookies.set).toHaveBeenCalledWith('sb-token', 'new-token');
      expect(request.cookies.set).toHaveBeenCalledWith('sb-refresh', 'new-refresh');
    });
  });
});
