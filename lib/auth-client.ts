'use client';

import { createAuthClient } from 'better-auth/react';

// Use environment variable if available, otherwise use relative path (works in production)
const baseURL = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
