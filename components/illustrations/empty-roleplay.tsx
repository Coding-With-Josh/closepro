'use client';

import * as React from 'react';

export function EmptyRoleplayIllustration({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M60 100c0-22 18-40 40-40s40 18 40 40" />
      <circle cx="100" cy="65" r="20" />
      <path d="M100 85v15M95 95h10" />
      <path d="M30 130h140" />
      <path d="M50 100l-15 30M150 100l15 30" />
    </svg>
  );
}
