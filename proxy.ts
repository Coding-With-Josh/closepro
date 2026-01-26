import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/signup', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // Special routes that handle their own authentication checks
  // These pages check for session client-side, so we allow them through
  const selfAuthRoutes = ['/dashboard/create-organization', '/dashboard/pricing'];
  const isSelfAuthRoute = selfAuthRoutes.some(route => pathname === route);

  // Check for Better Auth session cookie
  // Better Auth uses 'better-auth.session_token' as the cookie name
  // Also check alternative cookie names in case of configuration differences
  const sessionToken = 
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('better-auth_session_token') ||
    request.cookies.get('session_token');

  const hasSession = !!sessionToken;

  // Redirect to signin if accessing protected route without session
  if (!isPublicRoute && !isSelfAuthRoute && !hasSession) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard if accessing auth pages while logged in
  if ((pathname === '/signin' || pathname === '/signup') && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
