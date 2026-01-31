'use client';

import * as React from 'react';

export function EmptyCallsIllustration({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
      <path d="M100 20v20M100 120v20M20 80h20M160 80h20M45 45l14 14M141 141l14-14M45 115l14-14M141 19l14 14" />
      <circle cx="100" cy="80" r="35" />
      <path d="M85 75c0-8 7-15 15-15s15 7 15 15c0 5-2 9-6 12" />
      <path d="M100 90v10" />
    </svg>
  );
}
