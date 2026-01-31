'use client';

import * as React from 'react';

export function EmptyProspectsIllustration({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="100" cy="55" r="25" />
      <path d="M55 140c0-25 20-45 45-45s45 20 45 45" />
      <circle cx="70" cy="70" r="12" opacity="0.6" />
      <path d="M45 115c0-15 11-27 25-27" opacity="0.6" />
      <circle cx="130" cy="70" r="12" opacity="0.6" />
      <path d="M155 115c0-15-11-27-25-27" opacity="0.6" />
    </svg>
  );
}
