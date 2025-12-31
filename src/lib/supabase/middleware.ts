import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow access to login page without auth
  if (pathname === '/login') {
    if (user) {
      // Already logged in, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
    return supabaseResponse;
  }

  // Require authentication for all other routes
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role-based access
  const role = user.app_metadata?.role;

  // Only admin and printer roles are allowed
  if (role !== 'admin' && role !== 'printer') {
    // User exists but doesn't have admin/printer role
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Printer role can only access /orders routes
  if (role === 'printer' && !pathname.startsWith('/orders') && pathname !== '/') {
    return NextResponse.redirect(new URL('/orders', request.url));
  }

  return supabaseResponse;
}
