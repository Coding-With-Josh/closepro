import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { searchParams } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/signup', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // Special routes that handle their own authentication checks
  // These pages check for session client-side, so we allow them through
  const selfAuthRoutes = ['/dashboard/create-organization', '/dashboard/pricing'];
  const isSelfAuthRoute = selfAuthRoutes.some(route => pathname === route);

  // Check for Better Auth session cookie (try multiple possible cookie names)
  const sessionToken = 
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('better-auth_session_token') ||
    request.cookies.get('session_token');

  // If we have a _signedIn flag, allow the request through even if cookie check fails
  // This handles the timing issue where cookie is set but not yet readable
  const isJustSignedIn = searchParams.get('_signedIn') === 'true';

  // Redirect to signin if accessing protected route without session
  // But skip this check if:
  // 1. User just signed in (to handle cookie propagation delay)
  // 2. It's a self-auth route (page handles its own auth check)
  if (!isPublicRoute && !isSelfAuthRoute && !sessionToken && !isJustSignedIn) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard if accessing auth pages while logged in
  // Skip this redirect if user just signed in to avoid loops
  if ((pathname === '/signin' || pathname === '/signup') && sessionToken && !isJustSignedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
