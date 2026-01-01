import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type UserRole = 'admin' | 'printer';

interface AuthResult {
  user: {
    id: string;
    email: string | undefined;
  };
  role: UserRole;
}

/**
 * Get the current user and their role from the server.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<AuthResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const role = user.app_metadata?.role as UserRole | undefined;

  if (role !== 'admin' && role !== 'printer') {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    role,
  };
}

/**
 * Require admin role for a page. Redirects to /orders if user is a printer,
 * or /unauthorized if user has no valid role.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    redirect('/unauthorized');
  }

  if (auth.role !== 'admin') {
    // Printer users get redirected to orders
    redirect('/orders');
  }

  return auth;
}

/**
 * Require admin or printer role for a page.
 * Redirects to /unauthorized if user has no valid role.
 */
export async function requireAdminOrPrinter(): Promise<AuthResult> {
  const auth = await getAuthenticatedUser();

  if (!auth) {
    redirect('/unauthorized');
  }

  return auth;
}
