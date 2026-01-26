import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // #region agent log
  const allCookies: Record<string, string> = {};
  request.cookies.getAll().forEach(cookie => {
    allCookies[cookie.name] = cookie.value?.substring(0, 20) + '...';
  });
  fetch('http://127.0.0.1:7242/ingest/52c10fac-742a-4196-833c-68882aa7bf34',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'proxy.ts:5',message:'Proxy called',data:{pathname,cookieCount:Object.keys(allCookies).length,allCookieNames:Object.keys(allCookies)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

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
  const sessionToken1 = request.cookies.get('better-auth.session_token');
  const sessionToken2 = request.cookies.get('better-auth_session_token');
  const sessionToken3 = request.cookies.get('session_token');

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/52c10fac-742a-4196-833c-68882aa7bf34',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'proxy.ts:23',message:'Cookie check results',data:{'better-auth.session_token':!!sessionToken1,'better-auth_session_token':!!sessionToken2,'session_token':!!sessionToken3,pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  const sessionToken = sessionToken1 || sessionToken2 || sessionToken3;
  const hasSession = !!sessionToken;

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/52c10fac-742a-4196-833c-68882aa7bf34',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'proxy.ts:30',message:'Session check result',data:{hasSession,isPublicRoute,isSelfAuthRoute,pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  // Redirect to signin if accessing protected route without session
  if (!isPublicRoute && !isSelfAuthRoute && !hasSession) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/52c10fac-742a-4196-833c-68882aa7bf34',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'proxy.ts:35',message:'Redirecting to signin - no session',data:{pathname,reason:'no session token found'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard if accessing auth pages while logged in
  if ((pathname === '/signin' || pathname === '/signup') && hasSession) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/52c10fac-742a-4196-833c-68882aa7bf34',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'proxy.ts:42',message:'Redirecting to dashboard - has session',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/52c10fac-742a-4196-833c-68882aa7bf34',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'proxy.ts:47',message:'Proxy allowing request through',data:{pathname,hasSession},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
