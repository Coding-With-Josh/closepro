'use client';

import * as React from 'react';

/**
 * Hero illustration for dashboard - sales coaching / performance theme.
 * Uses currentColor so it respects theme.
 */
export function DashboardHeroIllustration({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M40 80V50l30-20 30 25 30-30 30 35v30" opacity="0.6" />
      <path d="M40 80h160" />
      <circle cx="120" cy="45" r="18" />
      <path d="M105 45h30M120 30v30" />
      <path d="M80 70l20 15 30-25 30 20" opacity="0.8" />
    </svg>
  );
}
